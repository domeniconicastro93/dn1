import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  authMiddleware,
  saveReplayRequestSchema,
  replayIdParamSchema,
  sessionIdParamSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  SaveReplayRequestDTO,
  ReplayResponseDTO,
  ReplayStatusResponseDTO,
} from '@strike/shared-types';
import type { AuthenticatedRequest } from '@strike/shared-utils';
import { initializeStreamDuplication, stopStreamDuplication } from './stream-duplicator';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'replay-engine-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `replay:${clientId}`,
    RateLimitConfigs.AUTHENTICATED
  );

  if (!result.allowed) {
    reply.status(429).send(
      errorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.'
      )
    );
    return;
  }

  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
};

// Auth middleware is imported from shared-utils

// POST /api/replay/v1/save - Save replay
app.post<{ Body: SaveReplayRequestDTO }>(
  '/api/replay/v1/save',
  {
    preHandler: [rateLimitMiddleware, authMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate body
      const validationResult = saveReplayRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request body',
            validationResult.error.errors
          )
        );
      }

      const { sessionId, gameId, fromSeconds, toSeconds, qualityPreset } = validationResult.data;
      const userId = request.user.userId;

      // Check idempotency key
      const idempotencyKey = request.headers['idempotency-key'] as string;
      if (!idempotencyKey) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Idempotency-Key header is required'
          )
        );
      }

      // Check if replay already exists (idempotency)
      const existingReplay = await prisma.replay.findFirst({
        where: {
          sessionId,
          userId,
          gameId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingReplay && existingReplay.status !== 'FAILED') {
        const response: ReplayResponseDTO = {
          replayId: existingReplay.id,
          status: existingReplay.status === 'READY' ? 'ready' : 'processing',
          storageUrl: existingReplay.storageUrl || undefined,
          estimatedTime: existingReplay.status === 'READY' ? 0 : 30,
        };
        return reply.status(200).send(successResponse(response));
      }

      // Verify session exists
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      // Create replay record
      const replay = await prisma.replay.create({
        data: {
          sessionId,
          userId,
          gameId,
          fromSeconds: fromSeconds || undefined,
          toSeconds: toSeconds || undefined,
          qualityPreset: qualityPreset || 'high',
          status: 'PROCESSING',
        },
      });

      // Trigger replay processing asynchronously (non-blocking)
      processReplaySave(
        replay.id,
        sessionId,
        userId,
        gameId,
        fromSeconds,
        toSeconds,
        qualityPreset || 'high'
      ).catch((error) => {
        app.log.error(`Error processing replay ${replay.id}:`, error);
      });

      const response: ReplayResponseDTO = {
        replayId: replay.id,
        status: 'processing',
        estimatedTime: 30,
      };

      return reply.status(202).send(successResponse(response));
    } catch (error) {
      app.log.error('Error saving replay:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to save replay')
      );
    }
  }
);

// GET /api/replay/v1/:replayId/status
app.get<{ Params: { replayId: string } }>(
  '/api/replay/v1/:replayId/status',
  {
    preHandler: [rateLimitMiddleware, authMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate params
      const validationResult = replayIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid replay ID format',
            validationResult.error.errors
          )
        );
      }

      const { id: replayId } = validationResult.data;

      // Get replay from database
      const replay = await prisma.replay.findUnique({
        where: { id: replayId },
      });

      if (!replay) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Replay not found')
        );
      }

      // Verify user owns this replay
      if (replay.userId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
        );
      }

      const status: ReplayStatusResponseDTO = {
        replayId: replay.id,
        status: replay.status === 'READY' ? 'ready' : replay.status === 'FAILED' ? 'failed' : 'processing',
        storageUrl: replay.storageUrl || undefined,
        progress: replay.status === 'READY' ? 100 : replay.status === 'FAILED' ? 0 : 50, // TODO: Track actual progress
      };

      return reply.status(200).send(successResponse(status));
    } catch (error) {
      app.log.error('Error fetching replay status:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch replay status')
      );
    }
  }
);

// POST /api/replay/v1/session/:sessionId/start-buffer - Start circular buffer for session
app.post<{ Params: { sessionId: string } }>(
  '/api/replay/v1/session/:sessionId/start-buffer',
  {
    preHandler: [rateLimitMiddleware, authMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate params
      const validationResult = sessionIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid session ID format',
            validationResult.error.errors
          )
        );
      }

      const { id: sessionId } = validationResult.data;

      // Verify session exists and belongs to user
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== request.user.userId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      initializeStreamDuplication(sessionId);

      return reply.status(200).send(
        successResponse({ message: 'Stream duplication started', sessionId })
      );
    } catch (error) {
      app.log.error('Error starting buffer:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to start buffer')
      );
    }
  }
);

// POST /api/replay/v1/session/:sessionId/stop-buffer - Stop circular buffer for session
app.post<{ Params: { sessionId: string } }>(
  '/api/replay/v1/session/:sessionId/stop-buffer',
  {
    preHandler: [rateLimitMiddleware, authMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate params
      const validationResult = sessionIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid session ID format',
            validationResult.error.errors
          )
        );
      }

      const { id: sessionId } = validationResult.data;

      // Verify session exists and belongs to user
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== request.user.userId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      stopStreamDuplication(sessionId);

      return reply.status(200).send(
        successResponse({ message: 'Stream duplication stopped', sessionId })
      );
    } catch (error) {
      app.log.error('Error stopping buffer:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to stop buffer')
      );
    }
  }
);

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  );
});

const PORT = parseInt(process.env.PORT || '3005', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Replay engine service listening on ${HOST}:${PORT}`);
});


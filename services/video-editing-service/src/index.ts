import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  authMiddleware,
  renderRequestSchema,
  renderIdParamSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  RenderRequestDTO,
  RenderResponseDTO,
} from '@strike/shared-types';
import type { AuthenticatedRequest } from '@strike/shared-utils';

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
  return successResponse({ status: 'ok', service: 'video-editing-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `editing:${clientId}`,
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

// POST /api/editing/v1/render - Render video with editing instructions
app.post<{ Body: RenderRequestDTO }>(
  '/api/editing/v1/render',
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
      const validationResult = renderRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request body',
            validationResult.error.errors
          )
        );
      }

      const { replayId, instructions } = validationResult.data;
      const userId = request.user.userId;

      // Verify replay exists and belongs to user
      const replay = await prisma.replay.findUnique({
        where: { id: replayId },
      });

      if (!replay) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Replay not found')
        );
      }

      if (replay.userId !== userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
        );
      }

      if (replay.status !== 'READY') {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Replay is not ready yet')
        );
      }

      // Create render job
      const renderJob = await prisma.renderJob.create({
        data: {
          replayId,
          userId,
          instructions: instructions as any, // Store as JSON
          status: 'QUEUED',
        },
      });

      // Trigger render processing asynchronously (non-blocking)
      const request: RenderRequestDTO = {
        replayId,
        instructions,
      };
      processRender(renderJob.id, userId, request).catch((error) => {
        app.log.error(`Error processing render ${renderJob.id}:`, error);
      });

      // Emit RenderRequested event
      await publishEvent(
        EventTopics.RENDERS,
        EventTypes.RENDER_REQUESTED,
        {
          renderId: renderJob.id,
          replayId,
          userId,
        },
        'video-editing-service'
      );

      const response: RenderResponseDTO = {
        renderId: renderJob.id,
        status: 'queued',
        estimatedTime: 60,
      };

      return reply.status(202).send(successResponse(response));
    } catch (error) {
      app.log.error('Error initiating render:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to start render')
      );
    }
  }
);

// GET /api/editing/v1/render/:renderId/status
app.get<{ Params: { renderId: string } }>(
  '/api/editing/v1/render/:renderId/status',
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
      const validationResult = renderIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid render ID format',
            validationResult.error.errors
          )
        );
      }

      const { id: renderId } = validationResult.data;

      // Get render job from database
      const renderJob = await prisma.renderJob.findUnique({
        where: { id: renderId },
      });

      if (!renderJob) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Render job not found')
        );
      }

      // Verify user owns this render job
      if (renderJob.userId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
        );
      }

      const status: RenderResponseDTO = {
        renderId: renderJob.id,
        status: renderJob.status === 'READY' ? 'ready' :
                renderJob.status === 'FAILED' ? 'failed' :
                renderJob.status === 'PROCESSING' ? 'processing' : 'queued',
        reelId: renderJob.reelId || undefined,
        videoUrl: renderJob.videoUrl || undefined,
        thumbnailUrl: renderJob.thumbnailUrl || undefined,
        estimatedTime: renderJob.status === 'READY' ? 0 :
                       renderJob.status === 'FAILED' ? 0 : 60,
      };

      return reply.status(200).send(successResponse(status));
    } catch (error) {
      app.log.error('Error fetching render status:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch render status')
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

// Start render queue processor (Master Prompt Section 9: "Rendering must be asynchronous and queued")
import { startRenderQueueProcessor } from './render-queue';
startRenderQueueProcessor(5000); // Process queue every 5 seconds

const PORT = parseInt(process.env.PORT || '3006', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Video editing service listening on ${HOST}:${PORT}`);
});


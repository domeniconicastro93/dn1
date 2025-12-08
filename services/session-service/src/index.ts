/**
 * Session Service - Complete Implementation with Database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  authMiddleware,
  createSessionRequestSchema,
  uuidSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  CreateSessionRequestDTO,
  SessionDTO,
  EndSessionRequestDTO,
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
  return successResponse({ status: 'ok', service: 'session-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `session:${clientId}`,
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

// POST /api/session/v1 - Create session
app.post<{ Body: CreateSessionRequestDTO }>(
  '/api/session/v1',
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

      // Validate input
      const validationResult = createSessionRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { gameId, region, deviceInfo } = validationResult.data;
      const userId = request.user.userId;

      // Verify game exists
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Game not found')
        );
      }

      // Call orchestrator-service to find/allocate VM
      const orchestratorUrl = process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012';

      let vmId: string | null = null;
      try {
        const findVMResponse = await fetch(`${orchestratorUrl}/api/orchestrator/v1/find-vm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region: region || 'us-east-1', gameId, maxSessions: 1 }),
        });

        if (findVMResponse.ok) {
          const findVMData = await findVMResponse.json();
          vmId = findVMData.data?.vmId || null;
        } else if (findVMResponse.status === 202) {
          // VM is provisioning, continue without vmId
        } else {
          app.log.warn('Failed to allocate VM, continuing without VM assignment');
        }
      } catch (error) {
        app.log.error('Error calling orchestrator:', error);
        // Continue without VM assignment
      }

      // Get streaming URLs from streaming-ingest-service
      const streamingUrl = process.env.STREAMING_SERVICE_URL || 'http://localhost:3014';
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let streamUrl = '';
      let controlChannelUrl = '';

      try {
        const streamUrlResponse = await fetch(
          `${streamingUrl}/api/streaming/v1/session/${sessionId}/stream-url`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (streamUrlResponse.ok) {
          const streamUrlData = await streamUrlResponse.json();
          streamUrl = streamUrlData.data.signalingUrl || '';
          controlChannelUrl = streamUrlData.data.controlUrl || '';
        }
      } catch (error) {
        app.log.error('Error getting streaming URL:', error);
      }

      // Assign session to VM if available
      if (vmId) {
        try {
          await fetch(`${orchestratorUrl}/api/orchestrator/v1/vm/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, vmId }),
          });
        } catch (error) {
          app.log.error('Error assigning session to VM:', error);
        }
      }

      // Create session record
      const session = await prisma.session.create({
        data: {
          userId,
          gameId,
          vmId: vmId || undefined,
          streamUrl: streamUrl || `ws://localhost:3014?sessionId=${sessionId}`,
          controlChannelUrl: controlChannelUrl || `ws://localhost:3014?sessionId=${sessionId}&type=control`,
          status: 'starting',
          region: region || 'us-east-1',
          deviceInfo: deviceInfo || undefined,
        },
      });

      // Emit SessionStarted event
      await publishEvent(
        EventTopics.SESSIONS,
        EventTypes.SESSION_STARTED,
        {
          sessionId: session.id,
          userId,
          gameId,
          vmId,
          region: session.region,
        },
        'session-service'
      );

      const sessionDTO: SessionDTO = {
        id: session.id,
        gameId: session.gameId,
        userId: session.userId,
        streamUrl: session.streamUrl,
        controlChannelUrl: session.controlChannelUrl,
        status: session.status as 'starting' | 'active' | 'paused' | 'ended' | 'error',
        startedAt: session.startedAt.toISOString(),
        region: session.region,
        vmId: session.vmId || undefined,
      };

      return reply.status(201).send(successResponse(sessionDTO));
    } catch (error) {
      app.log.error('Error creating session:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create session')
      );
    }
  }
);

// GET /api/session/v1 - List user sessions
app.get(
  '/api/session/v1',
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

      const sessions = await prisma.session.findMany({
        where: {
          userId: request.user.userId,
          status: { not: 'ended' },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });

      const sessionDTOs: SessionDTO[] = sessions.map((session) => ({
        id: session.id,
        gameId: session.gameId,
        userId: session.userId,
        streamUrl: session.streamUrl,
        controlChannelUrl: session.controlChannelUrl,
        status: session.status as 'starting' | 'active' | 'paused' | 'ended' | 'error',
        startedAt: session.startedAt.toISOString(),
        region: session.region,
        vmId: session.vmId || undefined,
      }));

      return reply.status(200).send(successResponse(sessionDTOs));
    } catch (error) {
      app.log.error('Error fetching sessions:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch sessions')
      );
    }
  }
);

// GET /api/session/v1/:sessionId
app.get<{ Params: { sessionId: string } }>(
  '/api/session/v1/:sessionId',
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
      const sessionId = request.params.sessionId;
      const uuidValidation = uuidSchema.safeParse(sessionId);
      if (!uuidValidation.success) {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid session ID format')
        );
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      // Verify user owns session
      if (session.userId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot access other user sessions')
        );
      }

      const sessionDTO: SessionDTO = {
        id: session.id,
        gameId: session.gameId,
        userId: session.userId,
        streamUrl: session.streamUrl,
        controlChannelUrl: session.controlChannelUrl,
        status: session.status as 'starting' | 'active' | 'paused' | 'ended' | 'error',
        startedAt: session.startedAt.toISOString(),
        region: session.region,
        vmId: session.vmId || undefined,
      };

      return reply.status(200).send(successResponse(sessionDTO));
    } catch (error) {
      app.log.error('Error fetching session:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch session')
      );
    }
  }
);

// PUT /api/session/v1/:sessionId/pause - Pause session
app.put<{ Params: { sessionId: string } }>(
  '/api/session/v1/:sessionId/pause',
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

      const { sessionId } = request.params;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== request.user.userId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      if (session.status !== 'active') {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Session is not active')
        );
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'paused' },
      });

      return reply.status(200).send(
        successResponse({ message: 'Session paused', status: updatedSession.status })
      );
    } catch (error) {
      app.log.error('Error pausing session:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to pause session')
      );
    }
  }
);

// PUT /api/session/v1/:sessionId/resume - Resume session
app.put<{ Params: { sessionId: string } }>(
  '/api/session/v1/:sessionId/resume',
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

      const { sessionId } = request.params;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== request.user.userId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      if (session.status !== 'paused') {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Session is not paused')
        );
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'active' },
      });

      return reply.status(200).send(
        successResponse({ message: 'Session resumed', status: updatedSession.status })
      );
    } catch (error) {
      app.log.error('Error resuming session:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to resume session')
      );
    }
  }
);

// POST /api/session/v1/:sessionId/end
app.post<{ Params: { sessionId: string }; Body: EndSessionRequestDTO }>(
  '/api/session/v1/:sessionId/end',
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

      const { sessionId } = request.params;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== request.user.userId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      // Release VM resources
      if (session.vmId) {
        const orchestratorUrl = process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012';
        try {
          await fetch(`${orchestratorUrl}/api/orchestrator/v1/vm/${session.vmId}/release`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
        } catch (error) {
          app.log.error('Error releasing VM:', error);
        }
      }

      // Update session status
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      });

      // Emit SessionEnded event
      await publishEvent(
        EventTopics.SESSIONS,
        EventTypes.SESSION_ENDED,
        {
          sessionId: updatedSession.id,
          userId: updatedSession.userId,
          gameId: updatedSession.gameId,
          duration: Math.floor(
            (updatedSession.endedAt!.getTime() - updatedSession.startedAt.getTime()) / 1000
          ),
        },
        'session-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Session ended', sessionId: updatedSession.id })
      );
    } catch (error) {
      app.log.error('Error ending session:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to end session')
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

const PORT = parseInt(process.env.PORT || '3004', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Session service listening on ${HOST}:${PORT}`);
});

/**
 * Community Service - Complete Implementation with Database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  optionalAuthMiddleware,
  authMiddleware,
  communityHubListQuerySchema,
  communityHubIdParamSchema,
  joinHubRequestSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  CommunityHubDTO,
  CommunityChannelDTO,
  CommunityEventDTO,
  CommunityHubListResponseDTO,
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
  return successResponse({ status: 'ok', service: 'community-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `community:${clientId}`,
    RateLimitConfigs.PUBLIC_GET
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

// GET /api/community/v1/hubs - List community hubs
app.get<{
  Querystring: {
    page?: string;
    pageSize?: string;
    search?: string;
  };
}>(
  '/api/community/v1/hubs',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate query params
      const validationResult = communityHubListQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { page, pageSize, search } = validationResult.data;

      // Build where clause
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.communityHub.count({ where });

      // Get hubs
      const hubs = await prisma.communityHub.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { memberCount: 'desc' },
      });

      const hubDTOs: CommunityHubDTO[] = hubs.map((hub) => ({
        id: hub.id,
        name: hub.name,
        description: hub.description || undefined,
        iconUrl: hub.iconUrl || undefined,
        memberCount: hub.memberCount,
        createdAt: hub.createdAt.toISOString(),
        updatedAt: hub.updatedAt.toISOString(),
      }));

      const response: CommunityHubListResponseDTO = {
        hubs: hubDTOs,
        total,
        pageToken: undefined,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error fetching hubs:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch hubs')
      );
    }
  }
);

// GET /api/community/v1/hubs/:hubId - Get hub by ID
app.get<{ Params: { hubId: string } }>(
  '/api/community/v1/hubs/:hubId',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate params
      const validationResult = communityHubIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid hub ID format',
            validationResult.error.errors
          )
        );
      }

      const { hubId } = validationResult.data;

      const hub = await prisma.communityHub.findUnique({
        where: { id: hubId },
      });

      if (!hub) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Hub not found')
        );
      }

      const hubDTO: CommunityHubDTO = {
        id: hub.id,
        name: hub.name,
        description: hub.description || undefined,
        iconUrl: hub.iconUrl || undefined,
        memberCount: hub.memberCount,
        createdAt: hub.createdAt.toISOString(),
        updatedAt: hub.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(hubDTO));
    } catch (error) {
      app.log.error('Error fetching hub:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch hub')
      );
    }
  }
);

// GET /api/community/v1/hubs/:hubId/channels - Get channels in hub
app.get<{ Params: { hubId: string } }>(
  '/api/community/v1/hubs/:hubId/channels',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { hubId } = request.params;

      const channels = await prisma.communityChannel.findMany({
        where: { hubId },
        orderBy: { createdAt: 'asc' },
      });

      const channelDTOs: CommunityChannelDTO[] = channels.map((channel) => ({
        id: channel.id,
        hubId: channel.hubId,
        name: channel.name,
        description: channel.description || undefined,
        type: channel.type as 'text' | 'voice' | 'announcement',
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
      }));

      return reply.status(200).send(successResponse(channelDTOs));
    } catch (error) {
      app.log.error('Error fetching channels:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch channels')
      );
    }
  }
);

// GET /api/community/v1/events - List community events
app.get<{
  Querystring: {
    hubId?: string;
    status?: string;
  };
}>(
  '/api/community/v1/events',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { hubId, status } = request.query;

      // Build where clause
      const where: any = {};
      if (hubId) {
        where.hubId = hubId;
      }
      if (status) {
        const now = new Date();
        if (status === 'upcoming') {
          where.startTime = { gt: now };
        } else if (status === 'live') {
          where.startTime = { lte: now };
          where.endTime = { gte: now };
        } else if (status === 'past') {
          where.endTime = { lt: now };
        }
      }

      const events = await prisma.communityEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        take: 50,
      });

      const eventDTOs: CommunityEventDTO[] = events.map((event) => ({
        id: event.id,
        hubId: event.hubId,
        title: event.title,
        description: event.description || undefined,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime?.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }));

      return reply.status(200).send(successResponse(eventDTOs));
    } catch (error) {
      app.log.error('Error fetching events:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch events')
      );
    }
  }
);

// POST /api/community/v1/hubs/:hubId/join - Join hub
app.post<{ Params: { hubId: string } }>(
  '/api/community/v1/hubs/:hubId/join',
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

      const { hubId } = request.params;

      // Validate hubId
      const validationResult = communityHubIdParamSchema.safeParse({ hubId });
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid hub ID format',
            validationResult.error.errors
          )
        );
      }

      // Check if hub exists
      const hub = await prisma.communityHub.findUnique({
        where: { id: hubId },
      });

      if (!hub) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Hub not found')
        );
      }

      // Check if already a member
      const existingMember = await prisma.communityHubMember.findFirst({
        where: {
          hubId,
          userId: request.user.userId,
        },
      });

      if (existingMember) {
        return reply.status(200).send(
          successResponse({ message: 'Already a member of this hub' })
        );
      }

      // Add user to hub members
      await prisma.communityHubMember.create({
        data: {
          hubId,
          userId: request.user.userId,
          role: 'member',
        },
      });

      // Update member count
      await prisma.communityHub.update({
        where: { id: hubId },
        data: {
          memberCount: { increment: 1 },
        },
      });

      // Emit event
      await publishEvent(
        EventTopics.USERS,
        'HubJoined',
        {
          userId: request.user.userId,
          hubId,
        },
        'community-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Joined hub successfully' })
      );
    } catch (error) {
      app.log.error('Error joining hub:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to join hub')
      );
    }
  }
);

// POST /api/community/v1/hubs - Create hub
app.post<{
  Body: { name: string; description?: string; iconUrl?: string };
}>(
  '/api/community/v1/hubs',
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

      const { name, description, iconUrl } = request.body;

      if (!name) {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Hub name is required')
        );
      }

      // Create hub
      const hub = await prisma.communityHub.create({
        data: {
          name,
          description: description || undefined,
          iconUrl: iconUrl || undefined,
          memberCount: 0,
        },
      });

      // Add creator as admin
      await prisma.communityHubMember.create({
        data: {
          hubId: hub.id,
          userId: request.user.userId,
          role: 'admin',
        },
      });

      // Update member count
      await prisma.communityHub.update({
        where: { id: hub.id },
        data: { memberCount: 1 },
      });

      const hubDTO: CommunityHubDTO = {
        id: hub.id,
        name: hub.name,
        description: hub.description || undefined,
        iconUrl: hub.iconUrl || undefined,
        memberCount: 1,
        createdAt: hub.createdAt.toISOString(),
        updatedAt: hub.updatedAt.toISOString(),
      };

      return reply.status(201).send(successResponse(hubDTO));
    } catch (error) {
      app.log.error('Error creating hub:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create hub')
      );
    }
  }
);

// PUT /api/community/v1/hubs/:hubId - Update hub
app.put<{
  Params: { hubId: string };
  Body: { name?: string; description?: string; iconUrl?: string };
}>(
  '/api/community/v1/hubs/:hubId',
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

      const { hubId } = request.params;
      const updates = request.body;

      // Verify user is admin or moderator
      const member = await prisma.communityHubMember.findFirst({
        where: {
          hubId,
          userId: request.user.userId,
          role: { in: ['admin', 'moderator'] },
        },
      });

      if (!member) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Only admins and moderators can update hubs')
        );
      }

      // Update hub
      const updatedHub = await prisma.communityHub.update({
        where: { id: hubId },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.iconUrl !== undefined && { iconUrl: updates.iconUrl }),
        },
      });

      const hubDTO: CommunityHubDTO = {
        id: updatedHub.id,
        name: updatedHub.name,
        description: updatedHub.description || undefined,
        iconUrl: updatedHub.iconUrl || undefined,
        memberCount: updatedHub.memberCount,
        createdAt: updatedHub.createdAt.toISOString(),
        updatedAt: updatedHub.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(hubDTO));
    } catch (error) {
      app.log.error('Error updating hub:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update hub')
      );
    }
  }
);

// DELETE /api/community/v1/hubs/:hubId - Delete hub
app.delete<{ Params: { hubId: string } }>(
  '/api/community/v1/hubs/:hubId',
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

      const { hubId } = request.params;

      // Verify user is admin
      const member = await prisma.communityHubMember.findFirst({
        where: {
          hubId,
          userId: request.user.userId,
          role: 'admin',
        },
      });

      if (!member) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Only admins can delete hubs')
        );
      }

      // Delete hub (cascade will handle members and channels)
      await prisma.communityHub.delete({
        where: { id: hubId },
      });

      return reply.status(200).send(
        successResponse({ message: 'Hub deleted successfully' })
      );
    } catch (error) {
      app.log.error('Error deleting hub:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete hub')
      );
    }
  }
);

// DELETE /api/community/v1/hubs/:hubId/join - Leave hub
app.delete<{ Params: { hubId: string } }>(
  '/api/community/v1/hubs/:hubId/join',
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

      const { hubId } = request.params;

      // Remove user from hub members
      await prisma.communityHubMember.deleteMany({
        where: {
          hubId,
          userId: request.user.userId,
        },
      });

      // Update member count
      await prisma.communityHub.update({
        where: { id: hubId },
        data: {
          memberCount: { decrement: 1 },
        },
      });

      // Emit event
      await publishEvent(
        EventTopics.USERS,
        'HubLeft',
        {
          userId: request.user.userId,
          hubId,
        },
        'community-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Left hub successfully' })
      );
    } catch (error) {
      app.log.error('Error leaving hub:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to leave hub')
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

const PORT = parseInt(process.env.PORT || '3016', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Community service listening on ${HOST}:${PORT}`);
});

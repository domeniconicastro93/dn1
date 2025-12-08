/**
 * Creator Service - Complete Implementation with Database
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
  creatorListQuerySchema,
  creatorHandleParamSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  CreatorDTO,
  CreatorStatsDTO,
  CreatorListResponseDTO,
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
  return successResponse({ status: 'ok', service: 'creator-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `creator:${clientId}`,
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

// GET /api/creator/v1 - List creators
app.get<{
  Querystring: {
    page?: string;
    pageSize?: string;
    search?: string;
  };
}>(
  '/api/creator/v1',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate query params
      const validationResult = creatorListQuerySchema.safeParse(request.query);
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
          { handle: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.creator.count({ where });

      // Get creators
      const creators = await prisma.creator.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { followerCount: 'desc' },
        include: {
          user: true,
        },
      });

      const creatorDTOs: CreatorDTO[] = creators.map((creator) => ({
        id: creator.id,
        userId: creator.userId,
        handle: creator.handle,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl || undefined,
        bio: creator.bio || undefined,
        followerCount: creator.followerCount,
        followingCount: creator.followingCount,
        clipCount: creator.clipCount,
        totalViews: creator.totalViews,
        trustScore: creator.trustScore,
        qualityScore: creator.qualityScore,
        createdAt: creator.createdAt.toISOString(),
        updatedAt: creator.updatedAt.toISOString(),
      }));

      const response: CreatorListResponseDTO = {
        creators: creatorDTOs,
        total,
        pageToken: undefined,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error fetching creators:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch creators')
      );
    }
  }
);

// GET /api/creator/v1/me - Get current user as creator
app.get(
  '/api/creator/v1/me',
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

      const creator = await prisma.creator.findUnique({
        where: { userId: request.user.userId },
        include: {
          user: true,
        },
      });

      if (!creator) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Creator profile not found')
        );
      }

      const creatorDTO: CreatorDTO = {
        id: creator.id,
        userId: creator.userId,
        handle: creator.handle,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl || undefined,
        bio: creator.bio || undefined,
        followerCount: creator.followerCount,
        followingCount: creator.followingCount,
        clipCount: creator.clipCount,
        totalViews: creator.totalViews,
        trustScore: creator.trustScore,
        qualityScore: creator.qualityScore,
        createdAt: creator.createdAt.toISOString(),
        updatedAt: creator.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(creatorDTO));
    } catch (error) {
      app.log.error('Error fetching creator profile:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch creator profile')
      );
    }
  }
);

// GET /api/creator/v1/:handle - Get creator by handle
app.get<{ Params: { handle: string } }>(
  '/api/creator/v1/:handle',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate params
      const validationResult = creatorHandleParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid handle format',
            validationResult.error.errors
          )
        );
      }

      const { handle } = validationResult.data;

      const creator = await prisma.creator.findUnique({
        where: { handle },
        include: {
          user: true,
        },
      });

      if (!creator) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Creator not found')
        );
      }

      const creatorDTO: CreatorDTO = {
        id: creator.id,
        userId: creator.userId,
        handle: creator.handle,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl || undefined,
        bio: creator.bio || undefined,
        followerCount: creator.followerCount,
        followingCount: creator.followingCount,
        clipCount: creator.clipCount,
        totalViews: creator.totalViews,
        trustScore: creator.trustScore,
        qualityScore: creator.qualityScore,
        createdAt: creator.createdAt.toISOString(),
        updatedAt: creator.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(creatorDTO));
    } catch (error) {
      app.log.error('Error fetching creator:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch creator')
      );
    }
  }
);

// GET /api/creator/v1/:handle/stats - Get creator statistics
app.get<{ Params: { handle: string } }>(
  '/api/creator/v1/:handle/stats',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { handle } = request.params;

      const creator = await prisma.creator.findUnique({
        where: { handle },
        include: {
          clips: {
            select: {
              views: true,
              likes: true,
            },
          },
        },
      });

      // Calculate stats
      const totalViews = clips.reduce((sum, clip) => sum + clip.views, 0);
      const totalLikes = clips.reduce((sum, clip) => sum + clip.likes, 0);
      const averageWatchTime = 0; // TODO: Calculate from analytics

      // Get top games
      const topGames = await prisma.clip.groupBy({
        by: ['gameId'],
        where: { creatorId: creator.userId },
        _count: { gameId: true },
        orderBy: { _count: { gameId: 'desc' } },
        take: 5,
      });

      const stats: CreatorStatsDTO = {
        creatorId: creator.id,
        totalClips: creator.clipCount,
        totalViews,
        totalLikes,
        totalFollowers: creator.followerCount,
        totalFollowing: creator.followingCount,
        averageWatchTime,
        topGames: topGames.map((g) => ({ gameId: g.gameId, clipCount: g._count.gameId })),
      };

      return reply.status(200).send(successResponse(stats));
    } catch (error) {
      app.log.error('Error fetching creator stats:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch creator stats')
      );
    }
  }
);

// POST /api/creator/v1/:handle/follow - Follow creator
app.post<{ Params: { handle: string } }>(
  '/api/creator/v1/:handle/follow',
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

      const { handle } = request.params;

      const creator = await prisma.creator.findUnique({
        where: { handle },
      });

      if (!creator) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Creator not found')
        );
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: request.user.userId,
            followingId: creator.userId,
          },
        },
      });

      if (existingFollow) {
        return reply.status(200).send(
          successResponse({ message: 'Already following this creator' })
        );
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: request.user.userId,
          followingId: creator.userId,
        },
      });

      // Update follower counts
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          followerCount: { increment: 1 },
        },
      });

      // Update user's following count
      const userCreator = await prisma.creator.findUnique({
        where: { userId: request.user.userId },
      });

      if (userCreator) {
        await prisma.creator.update({
          where: { id: userCreator.id },
          data: {
            followingCount: { increment: 1 },
          },
        });
      }

      // Emit event
      await publishEvent(
        EventTopics.USERS,
        'CreatorFollowed',
        {
          followerId: request.user.userId,
          followingId: creator.userId,
        },
        'creator-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Creator followed successfully' })
      );
    } catch (error) {
      app.log.error('Error following creator:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to follow creator')
      );
    }
  }
);

// DELETE /api/creator/v1/:handle/follow - Unfollow creator
app.delete<{ Params: { handle: string } }>(
  '/api/creator/v1/:handle/follow',
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

      const { handle } = request.params;

      const creator = await prisma.creator.findUnique({
        where: { handle },
      });

      if (!creator) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Creator not found')
        );
      }

      // Delete follow relationship
      await prisma.follow.deleteMany({
        where: {
          followerId: request.user.userId,
          followingId: creator.userId,
        },
      });

      // Update follower counts
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          followerCount: { decrement: 1 },
        },
      });

      // Update user's following count
      const userCreator = await prisma.creator.findUnique({
        where: { userId: request.user.userId },
      });

      if (userCreator) {
        await prisma.creator.update({
          where: { id: userCreator.id },
          data: {
            followingCount: { decrement: 1 },
          },
        });
      }

      // Emit event
      await publishEvent(
        EventTopics.USERS,
        'CreatorUnfollowed',
        {
          followerId: request.user.userId,
          followingId: creator.userId,
        },
        'creator-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Creator unfollowed successfully' })
      );
    } catch (error) {
      app.log.error('Error unfollowing creator:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to unfollow creator')
      );
    }
  }
);

// PUT /api/creator/v1/:handle - Update creator profile
app.put<{
  Params: { handle: string };
  Body: { displayName?: string; bio?: string; avatarUrl?: string };
}>(
  '/api/creator/v1/:handle',
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

      const { handle } = request.params;
      const updates = request.body;

      const creator = await prisma.creator.findUnique({
        where: { handle },
      });

      if (!creator) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Creator not found')
        );
      }

      // Verify user owns this creator profile
      if (creator.userId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot update other creators\' profiles')
        );
      }

      // Update creator
      const updatedCreator = await prisma.creator.update({
        where: { id: creator.id },
        data: {
          ...(updates.displayName !== undefined && { displayName: updates.displayName }),
          ...(updates.bio !== undefined && { bio: updates.bio }),
          ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
        },
        include: {
          user: true,
        },
      });

      const creatorDTO: CreatorDTO = {
        id: updatedCreator.id,
        userId: updatedCreator.userId,
        handle: updatedCreator.handle,
        displayName: updatedCreator.displayName,
        avatarUrl: updatedCreator.avatarUrl || undefined,
        bio: updatedCreator.bio || undefined,
        followerCount: updatedCreator.followerCount,
        followingCount: updatedCreator.followingCount,
        clipCount: updatedCreator.clipCount,
        totalViews: updatedCreator.totalViews,
        trustScore: updatedCreator.trustScore,
        qualityScore: updatedCreator.qualityScore,
        createdAt: updatedCreator.createdAt.toISOString(),
        updatedAt: updatedCreator.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(creatorDTO));
    } catch (error) {
      app.log.error('Error updating creator:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update creator')
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

const PORT = parseInt(process.env.PORT || '3015', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Creator service listening on ${HOST}:${PORT}`);
});

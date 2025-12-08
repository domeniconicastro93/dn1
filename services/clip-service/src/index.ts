/**
 * Clip Service - Complete Implementation with Database
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
  clipListQuerySchema,
  clipIdParamSchema,
  createClipFromReplayRequestSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  ClipDTO,
  ClipListResponseDTO,
  CreateClipFromReplayRequestDTO,
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
  return successResponse({ status: 'ok', service: 'clip-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `clip:${clientId}`,
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

// GET /api/clips/v1 - List clips
app.get<{
  Querystring: {
    pageToken?: string;
    gameId?: string;
    creatorId?: string;
    language?: string;
    tag?: string;
  };
}>(
  '/api/clips/v1',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate query params
      const validationResult = clipListQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { gameId, creatorId, language } = validationResult.data;

      // Build where clause
      const where: any = {
        status: 'published',
      };
      if (gameId) {
        where.gameId = gameId;
      }
      if (creatorId) {
        where.creatorId = creatorId;
      }
      if (language) {
        where.language = language;
      }

      // Get clips
      const clips = await prisma.clip.findMany({
        where,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          game: true,
          creator: {
            include: {
              user: true,
            },
          },
        },
      });

      const clipDTOs: ClipDTO[] = clips.map((clip) => ({
        id: clip.id,
        title: clip.title || undefined,
        description: clip.description || undefined,
        videoUrl: clip.videoUrl,
        thumbnailUrl: clip.thumbnailUrl,
        gameId: clip.gameId,
        gameTitle: clip.game.title,
        creatorId: clip.creatorId,
        creatorHandle: clip.creator.creatorProfile?.handle || clip.creator.handle || clip.creator.displayName || clip.creator.email || 'unknown',
        views: clip.views,
        likes: clip.likes,
        shares: clip.shares,
        comments: clip.comments,
        createdAt: clip.createdAt.toISOString(),
        duration: clip.duration,
        status: clip.status as 'pending' | 'published' | 'hidden',
      }));

      const response: ClipListResponseDTO = {
        clips: clipDTOs,
        total: clipDTOs.length,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error fetching clips:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch clips')
      );
    }
  }
);

// GET /api/clips/v1/:id - Get clip by ID
app.get<{ Params: { id: string } }>(
  '/api/clips/v1/:id',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate params
      const validationResult = clipIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid clip ID format',
            validationResult.error.errors
          )
        );
      }

      const { id } = validationResult.data;

      const clip = await prisma.clip.findUnique({
        where: { id },
        include: {
          game: true,
          creator: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!clip) {
      return reply.status(404).send(
        errorResponse(ErrorCodes.NOT_FOUND, 'Clip not found')
      );
    }

      // Increment views
      await prisma.clip.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      // Emit analytics event
      if (request.user) {
        await publishEvent(
          EventTopics.ANALYTICS,
          EventTypes.CLIP_VIEWED,
          {
            userId: request.user.userId,
            clipId: id,
          },
          'clip-service'
        );
      }

      const clipDTO: ClipDTO = {
        id: clip.id,
        title: clip.title || undefined,
        description: clip.description || undefined,
        videoUrl: clip.videoUrl,
        thumbnailUrl: clip.thumbnailUrl,
        gameId: clip.gameId,
        gameTitle: clip.game.title,
        creatorId: clip.creatorId,
        creatorHandle: clip.creator.creatorProfile?.handle || clip.creator.handle || clip.creator.displayName || clip.creator.email || 'unknown',
        views: clip.views + 1,
        likes: clip.likes,
        shares: clip.shares,
        comments: clip.comments,
        createdAt: clip.createdAt.toISOString(),
        duration: clip.duration,
        status: clip.status as 'pending' | 'published' | 'hidden',
      };

      return reply.status(200).send(successResponse(clipDTO));
    } catch (error) {
      app.log.error('Error fetching clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch clip')
      );
    }
  }
);

// POST /api/clips/v1/from-replay - Create clip from replay
app.post<{ Body: CreateClipFromReplayRequestDTO }>(
  '/api/clips/v1/from-replay',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate input
      const validationResult = createClipFromReplayRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { replayId, title, description } = validationResult.data;

      // Get replay
      const replay = await prisma.replay.findUnique({
        where: { id: replayId },
        include: {
          game: true,
        },
      });

      if (!replay || replay.status !== 'ready') {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Replay not found or not ready')
        );
      }

      // Get or create creator profile
      let creator = await prisma.creator.findUnique({
        where: { userId: replay.userId },
      });

      if (!creator) {
        // Create creator profile
        const user = await prisma.user.findUnique({ where: { id: replay.userId } });
        if (!user) {
          return reply.status(404).send(
            errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
          );
        }

        creator = await prisma.creator.create({
          data: {
            userId: replay.userId,
            handle: user.handle || `user_${replay.userId.substring(0, 8)}`,
            displayName: user.displayName || user.email,
            avatarUrl: user.avatarUrl,
          },
        });
      }

      // Create clip
      const clip = await prisma.clip.create({
        data: {
          title,
          description,
          videoUrl: replay.storageUrl,
          thumbnailUrl: replay.storageUrl.replace('.mp4', '_thumb.jpg'),
          gameId: replay.gameId,
          creatorId: creator.userId,
          replayId: replay.id,
          status: 'published',
          duration: replay.toSeconds ? replay.toSeconds - (replay.fromSeconds || 0) : 120,
        },
        include: {
          game: true,
          creator: {
            include: {
              creatorProfile: true,
            },
          },
        },
      });

      // Emit ClipPublished event
      await publishEvent(
        EventTopics.CLIPS,
        EventTypes.CLIP_PUBLISHED,
        {
          clipId: clip.id,
          creatorId: clip.creatorId,
          gameId: clip.gameId,
        },
        'clip-service'
      );

      const clipDTO: ClipDTO = {
        id: clip.id,
        title: clip.title || undefined,
        description: clip.description || undefined,
        videoUrl: clip.videoUrl,
        thumbnailUrl: clip.thumbnailUrl,
        gameId: clip.gameId,
        gameTitle: clip.game.title,
        creatorId: clip.creatorId,
        creatorHandle: clip.creator.creatorProfile?.handle || clip.creator.handle || clip.creator.displayName || clip.creator.email || 'unknown',
        views: clip.views,
        likes: clip.likes,
        shares: clip.shares,
        comments: clip.comments,
        createdAt: clip.createdAt.toISOString(),
        duration: clip.duration,
        status: clip.status as 'pending' | 'published' | 'hidden',
      };

      return reply.status(201).send(successResponse(clipDTO));
    } catch (error) {
      app.log.error('Error creating clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create clip')
      );
    }
  }
);

// POST /api/clips/v1/from-render - Create clip from render (Reel)
app.post<{
  Body: {
    renderId: string;
    reelId: string;
    videoUrl: string;
    thumbnailUrl: string;
    replayId: string;
    userId: string;
    title?: string;
    description?: string;
  };
}>(
  '/api/clips/v1/from-render',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const {
        renderId,
        reelId,
        videoUrl,
        thumbnailUrl,
        replayId,
        userId,
        title,
        description,
      } = request.body;

      if (!renderId || !reelId || !videoUrl || !thumbnailUrl || !replayId || !userId) {
      return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'renderId, reelId, videoUrl, thumbnailUrl, replayId, and userId are required'
          )
        );
      }

      // Get replay to get gameId
      const replay = await prisma.replay.findUnique({
        where: { id: replayId },
      });

      if (!replay) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Replay not found')
        );
      }

      // Get or create creator profile
      let creator = await prisma.creator.findUnique({
        where: { userId },
      });

      if (!creator) {
        // Create creator profile
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return reply.status(404).send(
            errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
          );
        }

        creator = await prisma.creator.create({
          data: {
            userId,
            handle: user.handle || `user_${userId.substring(0, 8)}`,
            displayName: user.displayName || user.email,
            avatarUrl: user.avatarUrl,
          },
        });
      }

      // Create clip/reel
      const clip = await prisma.clip.create({
        data: {
          id: reelId,
      title,
      description,
          videoUrl,
          thumbnailUrl,
          gameId: replay.gameId,
          creatorId: userId,
          replayId,
          renderId,
          isReel: true,
          status: 'published',
          duration: replay.toSeconds ? replay.toSeconds - (replay.fromSeconds || 0) : 120,
        },
        include: {
          game: true,
          creator: {
            include: {
              user: true,
            },
          },
        },
      });

      // Emit ClipPublished event
      await publishEvent(
        EventTopics.CLIPS,
        EventTypes.CLIP_PUBLISHED,
        {
          clipId: clip.id,
          creatorId: clip.creatorId,
          gameId: clip.gameId,
          isReel: true,
        },
        'clip-service'
      );

      const clipDTO: ClipDTO = {
        id: clip.id,
        title: clip.title || undefined,
        description: clip.description || undefined,
        videoUrl: clip.videoUrl,
        thumbnailUrl: clip.thumbnailUrl,
        gameId: clip.gameId,
        gameTitle: clip.game.title,
        creatorId: clip.creatorId,
        creatorHandle: clip.creator.creatorProfile?.handle || clip.creator.handle || clip.creator.displayName || clip.creator.email || 'unknown',
        views: clip.views,
        likes: clip.likes,
        shares: clip.shares,
        comments: clip.comments,
        createdAt: clip.createdAt.toISOString(),
        duration: clip.duration,
        status: clip.status as 'pending' | 'published' | 'hidden',
      };

      return reply.status(201).send(successResponse(clipDTO));
    } catch (error) {
      app.log.error('Error creating clip from render:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create clip from render')
      );
    }
  }
);

// POST /api/clips/v1/:id/like - Like clip
app.post<{ Params: { id: string } }>(
  '/api/clips/v1/:id/like',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      const { id } = request.params;

      // Increment likes
      await prisma.clip.update({
        where: { id },
        data: { likes: { increment: 1 } },
      });

      return reply.status(200).send(successResponse({ message: 'Clip liked' }));
    } catch (error) {
      app.log.error('Error liking clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to like clip')
      );
    }
  }
);

// POST /api/clips/v1/:id/share - Share clip
app.post<{ Params: { id: string } }>(
  '/api/clips/v1/:id/share',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      const { id } = request.params;

      // Increment shares
      await prisma.clip.update({
        where: { id },
        data: { shares: { increment: 1 } },
      });

      return reply.status(200).send(successResponse({ message: 'Clip shared' }));
    } catch (error) {
      app.log.error('Error sharing clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to share clip')
      );
    }
  }
);

// PUT /api/clips/v1/:id - Update clip
app.put<{
  Params: { id: string };
  Body: { title?: string; description?: string };
}>(
  '/api/clips/v1/:id',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate params
      const validationResult = clipIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid clip ID format',
            validationResult.error.errors
          )
        );
      }

      const { id } = validationResult.data;
      const { title, description } = request.body;

      // Get clip
      const clip = await prisma.clip.findUnique({
        where: { id },
      });

      if (!clip) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Clip not found')
        );
      }

      // Verify user owns clip
      if (clip.creatorId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot update other user clips')
        );
      }

      // Update clip
      const updatedClip = await prisma.clip.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
        },
        include: {
          game: true,
          creator: {
            include: {
              user: true,
            },
          },
        },
      });

      const clipDTO: ClipDTO = {
        id: updatedClip.id,
        title: updatedClip.title || undefined,
        description: updatedClip.description || undefined,
        videoUrl: updatedClip.videoUrl,
        thumbnailUrl: updatedClip.thumbnailUrl,
        gameId: updatedClip.gameId,
        gameTitle: updatedClip.game.title,
        creatorId: updatedClip.creatorId,
        creatorHandle: updatedClip.creator.creatorProfile?.handle || updatedClip.creator.handle || updatedClip.creator.displayName || updatedClip.creator.email || 'unknown',
        views: updatedClip.views,
        likes: updatedClip.likes,
        shares: updatedClip.shares,
        comments: updatedClip.comments,
        createdAt: updatedClip.createdAt.toISOString(),
        duration: updatedClip.duration,
        status: updatedClip.status as 'pending' | 'published' | 'hidden',
      };

      return reply.status(200).send(successResponse(clipDTO));
    } catch (error) {
      app.log.error('Error updating clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update clip')
      );
    }
  }
);

// DELETE /api/clips/v1/:id - Delete clip
app.delete<{ Params: { id: string } }>(
  '/api/clips/v1/:id',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate params
      const validationResult = clipIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid clip ID format',
            validationResult.error.errors
          )
        );
      }

      const { id } = validationResult.data;

      // Get clip
      const clip = await prisma.clip.findUnique({
        where: { id },
      });

      if (!clip) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Clip not found')
        );
      }

      // Verify user owns clip
      if (clip.creatorId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot delete other user clips')
        );
      }

      // Delete clip
      await prisma.clip.delete({
        where: { id },
      });

      return reply.status(200).send(
        successResponse({ message: 'Clip deleted successfully' })
      );
    } catch (error) {
      app.log.error('Error deleting clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete clip')
      );
    }
  }
);

// DELETE /api/clips/v1/:id - Delete clip
app.delete<{ Params: { id: string } }>(
  '/api/clips/v1/:id',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate params
      const validationResult = clipIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid clip ID format',
            validationResult.error.errors
          )
        );
      }

      const { id } = validationResult.data;

      // Verify clip exists and user owns it
      const clip = await prisma.clip.findUnique({
        where: { id },
      });

      if (!clip) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Clip not found')
        );
      }

      if (clip.creatorId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot delete other users\' clips')
        );
      }

      // Delete clip
      await prisma.clip.delete({
        where: { id },
      });

      return reply.status(200).send(
        successResponse({ message: 'Clip deleted successfully' })
      );
    } catch (error) {
      app.log.error('Error deleting clip:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete clip')
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

const PORT = parseInt(process.env.PORT || '3007', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Clip service listening on ${HOST}:${PORT}`);
});

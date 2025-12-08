/**
 * Feed Service - Complete Implementation with Database
 * Uses recommendation engine from feed-generator
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
  getFeedRequestSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  GetFeedRequestDTO,
  FeedResponseDTO,
} from '@strike/shared-types';
import type { AuthenticatedRequest } from '@strike/shared-utils';
import {
  generateForYouFeed,
  generateFollowingFeed,
  generateExploreFeed,
} from './feed-generator';
import { userSignalsStore } from './user-signals';
import { initializeDefaultConfig } from './config-loader';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

// Initialize default recommendation config on startup
initializeDefaultConfig().catch((error) => {
  app.log.error('Failed to initialize default recommendation config:', error);
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'feed-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `feed:${clientId}`,
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

// GET /api/feed/v1/for-you
app.get<{ Querystring: GetFeedRequestDTO & { userId?: string } }>(
  '/api/feed/v1/for-you',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate query params
      const validationResult = getFeedRequestSchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { pageToken, locale } = validationResult.data;
      const userId = request.user?.userId || request.query.userId;

      // Get candidate clips from database
      const clips = await prisma.clip.findMany({
        where: {
          status: 'published',
          ...(locale && { language: locale }),
        },
        take: 100, // Get more candidates for ranking
        orderBy: { createdAt: 'desc' },
        include: {
          game: true,
          creator: {
            include: {
              creatorProfile: true,
            },
          },
        },
      });

      // Convert to candidate format
      const candidateClips = clips.map((clip) => ({
        id: clip.id,
        gameId: clip.gameId,
        creatorId: clip.creatorId,
        views: clip.views,
        likes: clip.likes,
        shares: clip.shares,
        createdAt: clip.createdAt.toISOString(),
        language: clip.language || locale || 'en',
      }));

      // Build user signals
      const userSignals = userId
        ? await userSignalsStore.buildUserSignalsFromDB(userId, locale || 'en')
        : {
            userId: 'anonymous',
            locale: locale || 'en',
            isPremium: false,
            followedCreators: [],
            gamePreferences: {},
            recentWatches: [],
            recentCreators: [],
            recentGames: [],
          };

      // Generate For You feed
      const feed = await generateForYouFeed(candidateClips, userSignals, {
        userId,
        locale,
        pageToken,
        limit: 20,
      });

      return reply.status(200).send(successResponse(feed));
    } catch (error) {
      app.log.error('Error generating For You feed:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate feed')
      );
    }
  }
);

// GET /api/feed/v1/following
app.get<{ Querystring: GetFeedRequestDTO & { userId?: string } }>(
  '/api/feed/v1/following',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      const userId = request.user?.userId || request.query.userId;

      if (!userId) {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId is required for following feed')
        );
      }

      // Get followed creators
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followedCreatorIds = follows.map((f) => f.followingId);

      if (followedCreatorIds.length === 0) {
        return reply.status(200).send(
          successResponse({
            items: [],
            pageToken: undefined,
            hasMore: false,
          })
        );
      }

      // Get clips from followed creators
      const clips = await prisma.clip.findMany({
        where: {
          status: 'published',
          creatorId: { in: followedCreatorIds },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          game: true,
          creator: {
            include: {
              creatorProfile: true,
            },
          },
        },
      });

      const candidateClips = clips.map((clip) => ({
        id: clip.id,
        gameId: clip.gameId,
        creatorId: clip.creatorId,
        views: clip.views,
        likes: clip.likes,
        shares: clip.shares,
        createdAt: clip.createdAt.toISOString(),
        language: clip.language || 'en',
      }));

      const userSignals = await userSignalsStore.buildUserSignalsFromDB(userId, 'en');

      const feed = await generateFollowingFeed(candidateClips, userSignals, {
        userId,
        pageToken: request.query.pageToken,
        limit: 20,
      });

      return reply.status(200).send(successResponse(feed));
    } catch (error) {
      app.log.error('Error generating Following feed:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate feed')
      );
    }
  }
);

// GET /api/feed/v1/explore
app.get<{ Querystring: GetFeedRequestDTO & { userId?: string } }>(
  '/api/feed/v1/explore',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      const validationResult = getFeedRequestSchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { pageToken, locale } = validationResult.data;
      const userId = request.user?.userId || request.query.userId;

      // Get popular clips
      const clips = await prisma.clip.findMany({
        where: {
          status: 'published',
          ...(locale && { language: locale }),
        },
        take: 100,
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          game: true,
          creator: {
            include: {
              creatorProfile: true,
            },
          },
        },
      });

      const candidateClips = clips.map((clip) => ({
        id: clip.id,
        gameId: clip.gameId,
        creatorId: clip.creatorId,
        views: clip.views,
        likes: clip.likes,
        shares: clip.shares,
        createdAt: clip.createdAt.toISOString(),
        language: clip.language || locale || 'en',
      }));

      const userSignals = userId
        ? await userSignalsStore.buildUserSignalsFromDB(userId, locale || 'en')
        : {
            userId: 'anonymous',
            locale: locale || 'en',
            isPremium: false,
            followedCreators: [],
            gamePreferences: {},
            recentWatches: [],
            recentCreators: [],
            recentGames: [],
          };

      const feed = await generateExploreFeed(candidateClips, userSignals, {
        userId,
        locale,
        pageToken,
        limit: 20,
      });

      return reply.status(200).send(successResponse(feed));
    } catch (error) {
      app.log.error('Error generating Explore feed:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate feed')
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

const PORT = parseInt(process.env.PORT || '3008', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Feed service listening on ${HOST}:${PORT}`);
});

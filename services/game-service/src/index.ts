/**
 * Game Service - Complete Implementation with Database
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
} from '@strike/shared-utils';
import {
  gameListQuerySchema,
  gameSlugParamSchema,
} from './validation';
import { prisma } from '@strike/shared-db';
import type {
  GameDTO,
  GameListResponseDTO,
} from '@strike/shared-types';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors as any, {
  origin: true,
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'game-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `game:${clientId}`,
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

// GET /api/game/v1 - List games
app.get<{
  Querystring: {
    page?: string;
    pageSize?: string;
    genre?: string;
    search?: string;
  };
}>(
  '/api/game/v1',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    try {
      // Validate query params
      const validationResult = gameListQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { page, pageSize, genre, search } = validationResult.data;

      // Build where clause
      const where: any = {};
      if (genre) {
        where.genre = { has: genre };
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.game.count({ where });

      // Get games
      const games = await prisma.game.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });

      const gameDTOs: GameDTO[] = games.map((game) => ({
        id: game.id,
        slug: game.slug,
        steamAppId: game.steamAppId || undefined,
        title: game.title,
        description: game.description,
        thumbnailUrl: game.thumbnailUrl,
        coverImageUrl: game.coverImageUrl || undefined,
        genre: game.genre,
        rating: game.rating || undefined,
        releaseDate: game.releaseDate?.toISOString(),
        developer: game.developer || undefined,
        publisher: game.publisher || undefined,
        targetResolution: game.targetResolution as '1080p' | '1440p' | '4K' | undefined,
        targetFPS: game.targetFps as 60 | 120 | 240 | undefined,
        bitrateRange: game.bitrateRange as { min: number; max: number } | undefined,
        encoderPreset: game.encoderPreset || undefined,
        maxConcurrentSessionsPerVM: game.maxConcurrentSessionsPerVm || undefined,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      }));

      const response: GameListResponseDTO = {
        games: gameDTOs,
        total,
        page,
        pageSize,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error({ err: error }, 'Error fetching games');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch games')
      );
    }
  }
);

// GET /api/game/v1/:slug - Get game by slug
app.get<{ Params: { slug: string } }>(
  '/api/game/v1/:slug',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    try {
      // Validate params
      const validationResult = gameSlugParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid slug format',
            validationResult.error.errors
          )
        );
      }

      const { slug } = validationResult.data;

      const game = await prisma.game.findUnique({
        where: { slug },
      });

      if (!game) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Game not found')
        );
      }

      const gameDTO: GameDTO = {
        id: game.id,
        slug: game.slug,
        steamAppId: game.steamAppId || undefined,
        title: game.title,
        description: game.description,
        thumbnailUrl: game.thumbnailUrl,
        coverImageUrl: game.coverImageUrl || undefined,
        genre: game.genre,
        rating: game.rating || undefined,
        releaseDate: game.releaseDate?.toISOString(),
        developer: game.developer || undefined,
        publisher: game.publisher || undefined,
        targetResolution: game.targetResolution as '1080p' | '1440p' | '4K' | undefined,
        targetFPS: game.targetFps as 60 | 120 | 240 | undefined,
        bitrateRange: game.bitrateRange as { min: number; max: number } | undefined,
        encoderPreset: game.encoderPreset || undefined,
        maxConcurrentSessionsPerVM: game.maxConcurrentSessionsPerVm || undefined,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(gameDTO));
    } catch (error) {
      app.log.error({ err: error }, 'Error fetching game');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch game')
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

const PORT = parseInt(process.env.PORT || '3003', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Game service listening on ${HOST}:${PORT}`);
});

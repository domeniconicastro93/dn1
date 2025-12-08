/**
 * Moderation Service - Complete Implementation with Database
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
  moderationRequestSchema,
  contentFlagRequestSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  ModerationRequestDTO,
  ModerationResponseDTO,
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
  return successResponse({ status: 'ok', service: 'moderation-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `moderation:${clientId}`,
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

// Simple moderation check (placeholder for ML pipeline)
async function checkContentModeration(
  contentId: string,
  contentType: 'text' | 'image' | 'video',
  content: string | Record<string, unknown>
): Promise<{
  flagged: boolean;
  categories: string[];
  scores: Record<string, number>;
  action?: string;
}> {
  // TODO: Implement ML moderation pipeline in Phase 7
  // - Text moderation model for chat, comments, titles
  // - Image/video moderation model for thumbnails, frames
  // - Calculate trustScore and qualityScore
  // - Determine action (hide, age-restrict, shadowban, manual-review)

  // For now, return safe defaults
  return {
    flagged: false,
    categories: [],
    scores: {},
  };
}

// POST /api/moderation/v1/check - Check content for moderation
app.post<{ Body: ModerationRequestDTO }>(
  '/api/moderation/v1/check',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate input
      const validationResult = moderationRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { contentId, contentType, content } = validationResult.data;

      // Check if already moderated
      const existingCheck = await prisma.moderationCheck.findFirst({
        where: {
          contentId,
          contentType,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingCheck && existingCheck.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        // Return cached result if less than 24 hours old
        const response: ModerationResponseDTO = {
          contentId,
          flagged: existingCheck.flagged,
          categories: existingCheck.categories,
          scores: (existingCheck.scores as Record<string, number>) || {},
          action: existingCheck.action || undefined,
        };

        return reply.status(200).send(successResponse(response));
      }

      // Perform moderation check
      const moderationResult = await checkContentModeration(
        contentId,
        contentType,
        content
      );

      // Store moderation check
      await prisma.moderationCheck.create({
        data: {
          contentId,
          contentType,
          flagged: moderationResult.flagged,
          categories: moderationResult.categories,
          scores: moderationResult.scores,
          action: moderationResult.action || undefined,
        },
      });

      // Update creator trust/quality scores if needed
      if (moderationResult.flagged && contentType === 'video') {
        // Get creator from content (if it's a clip)
        const clip = await prisma.clip.findUnique({
          where: { id: contentId },
          select: { creatorId: true },
        });

        if (clip) {
          const creator = await prisma.creator.findUnique({
            where: { userId: clip.creatorId },
          });

          if (creator) {
            // Decrease trust score
            const newTrustScore = Math.max(0, creator.trustScore - 0.1);
            await prisma.creator.update({
              where: { id: creator.id },
              data: { trustScore: newTrustScore },
            });
          }
        }
      }

      const response: ModerationResponseDTO = {
        contentId,
        flagged: moderationResult.flagged,
        categories: moderationResult.categories,
        scores: moderationResult.scores,
        action: moderationResult.action || undefined,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error checking content moderation:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to check content moderation')
      );
    }
  }
);

// POST /api/moderation/v1/flag - Manual flagging by users
app.post<{
  Body: {
    contentId: string;
    contentType: 'text' | 'image' | 'video';
    reason: string;
  };
}>(
  '/api/moderation/v1/flag',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate input
      const validationResult = contentFlagRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { contentId, contentType, reason } = validationResult.data;
      const userId = request.user?.userId || 'anonymous';

      // Store flag in database (only if user is authenticated)
      if (userId !== 'anonymous') {
        await prisma.contentFlag.create({
          data: {
            contentId,
            contentType,
            userId,
            reason,
          },
        });
      }

      // Trigger moderation check
      const moderationResult = await checkContentModeration(
        contentId,
        contentType,
        {}
      );

      // Store moderation check
      await prisma.moderationCheck.create({
        data: {
          contentId,
          contentType,
          flagged: moderationResult.flagged || true, // User flags are taken seriously
          categories: ['user-flagged'],
          scores: moderationResult.scores,
          action: 'manual-review',
        },
      });

      // Emit ContentFlagged event
      await publishEvent(
        EventTopics.MODERATION,
        EventTypes.CONTENT_FLAGGED,
        {
          contentId,
          contentType,
          userId,
          reason,
        },
        'moderation-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Content flagged for review' })
      );
    } catch (error) {
      app.log.error('Error flagging content:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to flag content')
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

const PORT = parseInt(process.env.PORT || '3013', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Moderation service listening on ${HOST}:${PORT}`);
});

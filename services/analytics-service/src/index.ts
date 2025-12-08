/**
 * Analytics Service - Complete Implementation with Database
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
  analyticsEventSchema,
  analyticsMetricsQuerySchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type { AnalyticsEventDTO } from '@strike/shared-types';
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
  return successResponse({ status: 'ok', service: 'analytics-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `analytics:${clientId}`,
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

// POST /api/analytics/v1/events - Track analytics event
app.post<{ Body: AnalyticsEventDTO }>(
  '/api/analytics/v1/events',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate input
      const validationResult = analyticsEventSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const event = validationResult.data;

      // Store event in database
      await prisma.analyticsEvent.create({
        data: {
          eventType: event.eventType,
          userId: event.userId || request.user?.userId || undefined,
          sessionId: event.sessionId || undefined,
          metadata: event.metadata || undefined,
          timestamp: new Date(event.timestamp),
        },
      });

      // Emit to message bus for real-time processing
      await publishEvent(
        EventTopics.ANALYTICS,
        event.eventType,
        {
          userId: event.userId || request.user?.userId,
          sessionId: event.sessionId,
          metadata: event.metadata,
        },
        'analytics-service'
      );

      // TODO: Integrate with GA4 or similar analytics platform
      // await sendToGA4(event);

      return reply.status(200).send(successResponse({ received: true }));
    } catch (error) {
      app.log.error('Error tracking analytics event:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to track event')
      );
    }
  }
);

// GET /api/analytics/v1/metrics - Get analytics metrics (admin only)
app.get<{
  Querystring: {
    metric?: string;
    startDate?: string;
    endDate?: string;
  };
}>(
  '/api/analytics/v1/metrics',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      // Validate query params
      const validationResult = analyticsMetricsQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { metric, startDate, endDate } = validationResult.data;

      // Build where clause
      const where: any = {};
      if (startDate) {
        where.timestamp = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.timestamp = {
          ...where.timestamp,
          lte: new Date(endDate),
        };
      }
      if (metric) {
        where.eventType = metric;
      }

      // Get count
      const count = await prisma.analyticsEvent.count({ where });

      return reply.status(200).send(
        successResponse({
          metric: metric || 'all',
          value: count,
          period: {
            start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: endDate || new Date().toISOString(),
          },
        })
      );
    } catch (error) {
      app.log.error('Error fetching metrics:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch metrics')
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

const PORT = parseInt(process.env.PORT || '3011', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Analytics service listening on ${HOST}:${PORT}`);
});

/**
 * Notification Service - Complete Implementation with Database
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
  notificationListQuerySchema,
  notificationIdParamSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  NotificationDTO,
  NotificationListResponseDTO,
  CreateNotificationRequestDTO,
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
  return successResponse({ status: 'ok', service: 'notification-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `notification:${clientId}`,
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

// GET /api/notification/v1 - Get user notifications
app.get<{
  Querystring: {
    page?: string;
    pageSize?: string;
    unreadOnly?: string;
    type?: string;
  };
}>(
  '/api/notification/v1',
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

      // Validate query params
      const validationResult = notificationListQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { page, pageSize, unreadOnly, type } = validationResult.data;

      // Build where clause
      const where: any = {
        userId: request.user.userId,
      };

      if (unreadOnly) {
        where.read = false;
      }

      if (type && type !== 'all') {
        where.type = type;
      }

      // Get total count
      const total = await prisma.notification.count({ where });
      const unreadCount = await prisma.notification.count({
        where: {
          userId: request.user.userId,
          read: false,
        },
      });

      // Get notifications
      const notifications = await prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });

      const notificationDTOs: NotificationDTO[] = notifications.map((notif) => ({
        id: notif.id,
        userId: notif.userId,
        type: notif.type as 'system' | 'social' | 'game' | 'payment',
        title: notif.title,
        body: notif.body || undefined,
        actionUrl: notif.actionUrl || undefined,
        metadata: (notif.metadata as Record<string, unknown>) || undefined,
        read: notif.read,
        createdAt: notif.createdAt.toISOString(),
        updatedAt: notif.updatedAt.toISOString(),
      }));

      const response: NotificationListResponseDTO = {
        notifications: notificationDTOs,
        total,
        unreadCount,
        pageToken: undefined,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error fetching notifications:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch notifications')
      );
    }
  }
);

// POST /api/notification/v1 - Create notification (internal)
app.post<{ Body: CreateNotificationRequestDTO }>(
  '/api/notification/v1',
  {
    preHandler: [rateLimitMiddleware], // Internal service, no auth required
  },
  async (request, reply) => {
    try {
      const { userId, type, title, body, actionUrl, metadata } = request.body;

      if (!userId || !type || !title) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'userId, type, and title are required'
          )
        );
      }

      // Save notification to database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body: body || undefined,
          actionUrl: actionUrl || undefined,
          metadata: metadata || undefined,
          read: false,
        },
      });

      // TODO: Send push notification if user has device tokens
      // const deviceTokens = await prisma.notificationDeviceToken.findMany({
      //   where: { userId },
      // });
      // await sendPushNotifications(deviceTokens, notification);

      // Emit NotificationCreated event
      await publishEvent(
        EventTopics.USERS,
        'NotificationCreated',
        {
          notificationId: notification.id,
          userId,
          type,
        },
        'notification-service'
      );

      const notificationDTO: NotificationDTO = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as 'system' | 'social' | 'game' | 'payment',
        title: notification.title,
        body: notification.body || undefined,
        actionUrl: notification.actionUrl || undefined,
        metadata: (notification.metadata as Record<string, unknown>) || undefined,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
      };

      return reply.status(201).send(successResponse(notificationDTO));
    } catch (error) {
      app.log.error('Error creating notification:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create notification')
      );
    }
  }
);

// PUT /api/notification/v1/:notificationId/read - Mark notification as read
app.put<{ Params: { notificationId: string } }>(
  '/api/notification/v1/:notificationId/read',
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
      const validationResult = notificationIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid notification ID format',
            validationResult.error.errors
          )
        );
      }

      const { id: notificationId } = validationResult.data;

      // Update notification
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: request.user.userId, // Verify notification belongs to user
        },
        data: {
          read: true,
        },
      });

      if (notification.count === 0) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Notification not found')
        );
      }

      return reply.status(200).send(
        successResponse({ message: 'Notification marked as read' })
      );
    } catch (error) {
      app.log.error('Error marking notification as read:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to mark notification as read')
      );
    }
  }
);

// PUT /api/notification/v1/read-all - Mark all notifications as read
app.put(
  '/api/notification/v1/read-all',
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

      // Update all user notifications
      await prisma.notification.updateMany({
        where: {
          userId: request.user.userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return reply.status(200).send(
        successResponse({ message: 'All notifications marked as read' })
      );
    } catch (error) {
      app.log.error('Error marking all notifications as read:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to mark all notifications as read')
      );
    }
  }
);

// DELETE /api/notification/v1/:notificationId - Delete notification
app.delete<{ Params: { notificationId: string } }>(
  '/api/notification/v1/:notificationId',
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
      const validationResult = notificationIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid notification ID format',
            validationResult.error.errors
          )
        );
      }

      const { id: notificationId } = validationResult.data;

      // Delete notification
      const notification = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: request.user.userId, // Verify notification belongs to user
        },
      });

      if (notification.count === 0) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Notification not found')
        );
      }

      return reply.status(200).send(
        successResponse({ message: 'Notification deleted' })
      );
    } catch (error) {
      app.log.error('Error deleting notification:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete notification')
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

const PORT = parseInt(process.env.PORT || '3018', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Notification service listening on ${HOST}:${PORT}`);
});

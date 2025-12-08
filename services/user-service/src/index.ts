/**
 * User Service - Complete Implementation with Database
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
  authMiddleware,
  optionalAuthMiddleware,
  updateUserRequestSchema,
  uuidSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  UserDTO,
  UpdateUserRequestDTO,
} from '@strike/shared-types';
import type { AuthenticatedRequest } from '@strike/shared-utils';

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
  return successResponse({ status: 'ok', service: 'user-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `user:${clientId}`,
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

// GET /api/user/v1/me - Get current user
app.get(
  '/api/user/v1/me',
  {
    preHandler: [rateLimitMiddleware, authMiddleware as any],
  },
  async (request: any, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
      });

      if (!user) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
        );
      }

      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        handle: user.handle || undefined,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatarUrl || undefined,
        locale: user.locale,
        steamId64: user.steamId64 || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(userDTO));
    } catch (error) {
      app.log.error({ error }, 'Error fetching user');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch user')
      );
    }
  }
);

// GET /api/user/v1/:userId - Get user by ID
app.get<{ Params: { userId: string } }>(
  '/api/user/v1/:userId',
  {
    preHandler: [rateLimitMiddleware, optionalAuthMiddleware as any],
  },
  async (request: any, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      // Validate UUID
      const uuidValidation = uuidSchema.safeParse(userId);
      if (!uuidValidation.success) {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID format')
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
        );
      }

      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        handle: user.handle || undefined,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatarUrl || undefined,
        locale: user.locale,
        steamId64: user.steamId64 || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(userDTO));
    } catch (error) {
      app.log.error({ error }, 'Error fetching user');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch user')
      );
    }
  }
);

// PUT /api/user/v1/:userId - Update user
app.put<{ Params: { userId: string }; Body: UpdateUserRequestDTO }>(
  '/api/user/v1/:userId',
  {
    preHandler: [rateLimitMiddleware, authMiddleware as any],
  },
  async (request: any, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      const { userId } = request.params as { userId: string };
      const updates = request.body as UpdateUserRequestDTO;

      // Validate user can only update their own profile
      if (request.user.userId !== userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot update other user profiles')
        );
      }

      // Validate input
      const validationResult = updateUserRequestSchema.safeParse(updates);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      // Check handle uniqueness if handle is being updated
      if (updates.handle) {
        const existingUser = await prisma.user.findFirst({
          where: {
            handle: updates.handle,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return reply.status(409).send(
            errorResponse(ErrorCodes.HANDLE_TAKEN, 'Handle already taken')
          );
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updates.displayName !== undefined && { displayName: updates.displayName }),
          ...(updates.handle !== undefined && { handle: updates.handle }),
          ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
          ...(updates.locale !== undefined && { locale: updates.locale }),
          ...(updates.steamId64 !== undefined && { steamId64: updates.steamId64 }),
        },
      });

      // Emit event
      await publishEvent(
        EventTopics.USERS,
        EventTypes.USER_UPDATED,
        {
          userId: updatedUser.id,
          updates,
        },
        'user-service'
      );

      const userDTO: UserDTO = {
        id: updatedUser.id,
        email: updatedUser.email,
        handle: updatedUser.handle || undefined,
        displayName: updatedUser.displayName || undefined,
        avatarUrl: updatedUser.avatarUrl || undefined,
        locale: updatedUser.locale,
        steamId64: updatedUser.steamId64 || undefined,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(userDTO));
    } catch (error) {
      app.log.error({ error }, 'Error updating user');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update user')
      );
    }
  }
);

// DELETE /api/user/v1/:userId - Delete user account
app.delete<{ Params: { userId: string } }>(
  '/api/user/v1/:userId',
  {
    preHandler: [rateLimitMiddleware, authMiddleware as any],
  },
  async (request: any, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      const { userId } = request.params as { userId: string };

      // Validate user can only delete their own account
      if (request.user.userId !== userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot delete other user accounts')
        );
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return reply.status(200).send(
        successResponse({ message: 'User account deleted successfully' })
      );
    } catch (error) {
      app.log.error({ error }, 'Error deleting user');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete user')
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

const PORT = parseInt(process.env.PORT || '3002', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`User service listening on ${HOST}:${PORT}`);
});

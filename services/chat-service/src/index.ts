/**
 * Chat Service - Complete Implementation with Database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  authMiddleware,
  chatChannelListQuerySchema,
  chatChannelIdParamSchema,
  sendMessageRequestSchema,
  chatMessageListQuerySchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  ChatMessageDTO,
  ChatChannelDTO,
  ChatMessageListResponseDTO,
  SendMessageRequestDTO,
} from '@strike/shared-types';
import type { AuthenticatedRequest } from '@strike/shared-utils';
import {
  joinStreamChat,
  leaveStreamChat,
  sendStreamChatMessage,
  getStreamViewerCount,
  clearStreamChat,
} from './live-stream-chat';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

app.register(websocket);

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'chat-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `chat:${clientId}`,
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

// Store active WebSocket connections
const activeConnections = new Map<string, Set<any>>();

// GET /api/chat/v1/channels - List chat channels
app.get<{
  Querystring: {
    page?: string;
    pageSize?: string;
    type?: string;
  };
}>(
  '/api/chat/v1/channels',
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
      const validationResult = chatChannelListQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { type } = validationResult.data;

      // Build where clause
      const where: any = {};
      if (type) {
        where.type = type;
      }

      // Get channels user is member of
      const userChannels = await prisma.chatChannelMember.findMany({
        where: { userId: request.user.userId },
        include: {
          channel: true,
        },
      });

      const channelDTOs: ChatChannelDTO[] = userChannels.map((member) => ({
        id: member.channel.id,
        name: member.channel.name,
        type: member.channel.type as 'public' | 'private' | 'dm',
        description: member.channel.description || undefined,
        createdAt: member.channel.createdAt.toISOString(),
        updatedAt: member.channel.updatedAt.toISOString(),
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

// GET /api/chat/v1/channels/:channelId/messages - Get messages in channel
app.get<{
  Params: { channelId: string };
  Querystring: {
    page?: string;
    pageSize?: string;
    before?: string;
  };
}>(
  '/api/chat/v1/channels/:channelId/messages',
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
      const validationResult = chatChannelIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid channel ID format',
            validationResult.error.errors
          )
        );
      }

      const { channelId } = validationResult.data;
      const { page, pageSize, before } = request.query;

      // Verify user is member of channel
      const member = await prisma.chatChannelMember.findFirst({
        where: {
          channelId,
          userId: request.user.userId,
        },
      });

      if (!member) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Not a member of this channel')
        );
      }

      // Build where clause
      const where: any = { channelId };
      if (before) {
        where.createdAt = { lt: new Date(before) };
      }

      // Get messages
      const messages = await prisma.chatMessage.findMany({
        where,
        take: pageSize ? parseInt(pageSize, 10) : 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      const total = await prisma.chatMessage.count({ where });

      // Update last read timestamp
      await prisma.chatChannelMember.updateMany({
        where: {
          channelId,
          userId: request.user.userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      const messageDTOs: ChatMessageDTO[] = messages.reverse().map((msg) => ({
        id: msg.id,
        channelId: msg.channelId,
        userId: msg.userId,
        userHandle: msg.user.handle || msg.user.displayName || 'unknown',
        text: msg.text,
        replyToMessageId: msg.replyToMessageId || undefined,
        createdAt: msg.createdAt.toISOString(),
      }));

      const response: ChatMessageListResponseDTO = {
        messages: messageDTOs,
        total,
        pageToken: messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : undefined,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error fetching messages:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch messages')
      );
    }
  }
);

// POST /api/chat/v1/channels/:channelId/messages - Send message
app.post<{
  Params: { channelId: string };
  Body: SendMessageRequestDTO;
}>(
  '/api/chat/v1/channels/:channelId/messages',
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
      const channelValidation = chatChannelIdParamSchema.safeParse(request.params);
      if (!channelValidation.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid channel ID format',
            channelValidation.error.errors
          )
        );
      }

      // Validate body
      const messageValidation = sendMessageRequestSchema.safeParse(request.body);
      if (!messageValidation.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid message format',
            messageValidation.error.errors
          )
        );
      }

      const { channelId } = channelValidation.data;
      const { text, replyToMessageId } = messageValidation.data;

      // Verify user is member of channel
      const member = await prisma.chatChannelMember.findFirst({
        where: {
          channelId,
          userId: request.user.userId,
        },
      });

      if (!member) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Not a member of this channel')
        );
      }

      // TODO: Validate message with moderation-service
      // const moderationResult = await checkMessageModeration(text);

      // Save message to database
      const message = await prisma.chatMessage.create({
        data: {
          channelId,
          userId: request.user.userId,
          text,
          replyToMessageId: replyToMessageId || undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update channel last message timestamp
      await prisma.chatChannel.update({
        where: { id: channelId },
        data: { updatedAt: new Date() },
      });

      // Broadcast message to channel via WebSocket
      const channelConnections = activeConnections.get(channelId) || new Set();
      const messageData = {
        id: message.id,
        channelId: message.channelId,
        userId: message.userId,
        userHandle: message.user.handle || message.user.displayName || 'unknown',
        text: message.text,
        replyToMessageId: message.replyToMessageId || undefined,
        createdAt: message.createdAt.toISOString(),
      };

      channelConnections.forEach((conn) => {
        try {
          conn.send(JSON.stringify({ type: 'message', data: messageData }));
        } catch (error) {
          app.log.error('Error broadcasting message:', error);
        }
      });

      // Emit MessageSent event
      await publishEvent(
        EventTopics.USERS,
        'MessageSent',
        {
          messageId: message.id,
          channelId,
          userId: request.user.userId,
        },
        'chat-service'
      );

      const messageDTO: ChatMessageDTO = {
        id: message.id,
        channelId: message.channelId,
        userId: message.userId,
        userHandle: message.user.handle || message.user.displayName || 'unknown',
        text: message.text,
        replyToMessageId: message.replyToMessageId || undefined,
        createdAt: message.createdAt.toISOString(),
      };

      return reply.status(201).send(successResponse(messageDTO));
    } catch (error) {
      app.log.error('Error sending message:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to send message')
      );
    }
  }
);

// WebSocket endpoint for real-time chat
app.register(async function (fastify) {
  fastify.get(
    '/api/chat/v1/channels/:channelId/ws',
    { websocket: true },
    async (connection, req) => {
      const { channelId } = req.params as { channelId: string };
      const token = (req.query as { token?: string })?.token || 
                    req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        connection.socket.close(1008, 'Authentication required');
        return;
      }

      // TODO: Validate JWT token
      // For now, just check token exists
      // const payload = verifyAccessToken(token);

      // Verify user is member of channel
      // This should be done after JWT validation
      // const member = await prisma.chatChannelMember.findFirst({...});

      // Add connection to channel room
      if (!activeConnections.has(channelId)) {
        activeConnections.set(channelId, new Set());
      }
      activeConnections.get(channelId)!.add(connection.socket);

      // Send recent messages on connect
      try {
        const recentMessages = await prisma.chatMessage.findMany({
          where: { channelId },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                handle: true,
                displayName: true,
              },
            },
          },
        });

        connection.socket.send(JSON.stringify({
          type: 'history',
          messages: recentMessages.reverse().map((msg) => ({
            id: msg.id,
            channelId: msg.channelId,
            userId: msg.userId,
            userHandle: msg.user.handle || msg.user.displayName || 'unknown',
            text: msg.text,
            replyToMessageId: msg.replyToMessageId || undefined,
            createdAt: msg.createdAt.toISOString(),
          })),
        }));
      } catch (error) {
        app.log.error('Error sending message history:', error);
      }

      connection.socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          if (data.type === 'send') {
            // Message sending is handled via REST API
            connection.socket.send(JSON.stringify({
              error: { code: 'USE_REST_API', message: 'Use POST /messages to send messages' },
            }));
          } else if (data.type === 'typing') {
            // Broadcast typing indicator
            const channelConnections = activeConnections.get(channelId) || new Set();
            channelConnections.forEach((conn) => {
              if (conn !== connection.socket) {
                try {
                  conn.send(JSON.stringify({ type: 'typing', userId: data.userId }));
                } catch (error) {
                  app.log.error('Error broadcasting typing:', error);
                }
              }
            });
          }
        } catch (error) {
          connection.socket.send(JSON.stringify({
            error: { code: 'INVALID_MESSAGE', message: 'Invalid message format' },
          }));
        }
      });

      connection.socket.on('close', () => {
        // Remove connection from channel room
        const channelConnections = activeConnections.get(channelId);
        if (channelConnections) {
          channelConnections.delete(connection.socket);
          if (channelConnections.size === 0) {
            activeConnections.delete(channelId);
          }
        }
      });
    }
  );
});

// PUT /api/chat/v1/channels/:channelId/messages/:messageId - Edit message
app.put<{
  Params: { channelId: string; messageId: string };
  Body: { text: string };
}>(
  '/api/chat/v1/channels/:channelId/messages/:messageId',
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

      const { channelId, messageId } = request.params;
      const { text } = request.body;

      if (!text) {
        return reply.status(400).send(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Message text is required')
        );
      }

      // Verify user owns the message
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message || message.channelId !== channelId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Message not found')
        );
      }

      if (message.userId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot edit other users\' messages')
        );
      }

      // Update message
      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { text },
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              displayName: true,
            },
          },
        },
      });

      const messageDTO: ChatMessageDTO = {
        id: updatedMessage.id,
        channelId: updatedMessage.channelId,
        userId: updatedMessage.userId,
        userHandle: updatedMessage.user.handle || updatedMessage.user.displayName || 'unknown',
        text: updatedMessage.text,
        replyToMessageId: updatedMessage.replyToMessageId || undefined,
        createdAt: updatedMessage.createdAt.toISOString(),
      };

      return reply.status(200).send(successResponse(messageDTO));
    } catch (error) {
      app.log.error('Error editing message:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to edit message')
      );
    }
  }
);

// DELETE /api/chat/v1/channels/:channelId/messages/:messageId - Delete message
app.delete<{
  Params: { channelId: string; messageId: string };
}>(
  '/api/chat/v1/channels/:channelId/messages/:messageId',
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

      const { channelId, messageId } = request.params;

      // Verify user owns the message or is moderator
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          channel: {
            include: {
              hub: {
                include: {
                  members: {
                    where: {
                      userId: request.user.userId,
                      role: { in: ['admin', 'moderator'] },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!message || message.channelId !== channelId) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Message not found')
        );
      }

      const isOwner = message.userId === request.user.userId;
      const isModerator = message.channel.hub.members.length > 0;

      if (!isOwner && !isModerator) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot delete other users\' messages')
        );
      }

      // Delete message
      await prisma.chatMessage.delete({
        where: { id: messageId },
      });

      return reply.status(200).send(
        successResponse({ message: 'Message deleted successfully' })
      );
    } catch (error) {
      app.log.error('Error deleting message:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete message')
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

const PORT = parseInt(process.env.PORT || '3017', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Chat service listening on ${HOST}:${PORT}`);
});

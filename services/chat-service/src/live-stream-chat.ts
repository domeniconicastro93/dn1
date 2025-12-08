/**
 * Live Stream Chat Handler
 * 
 * Phase 7: Live Streaming
 * 
 * Real-time chat for live streams
 */

import { WebSocket } from 'ws';
import { prisma } from '@strike/shared-db';
import { publishEvent, EventTopics, EventTypes } from '@strike/shared-utils';

export interface LiveStreamChatConnection {
  streamId: string;
  userId: string;
  ws: WebSocket;
  joinedAt: Date;
}

// Store active chat connections per stream
const streamChatConnections = new Map<string, Set<LiveStreamChatConnection>>();

/**
 * Join live stream chat
 */
export function joinStreamChat(streamId: string, userId: string, ws: WebSocket): void {
  if (!streamChatConnections.has(streamId)) {
    streamChatConnections.set(streamId, new Set());
  }

  const connection: LiveStreamChatConnection = {
    streamId,
    userId,
    ws,
    joinedAt: new Date(),
  };

  streamChatConnections.get(streamId)!.add(connection);

  // Send join confirmation
  ws.send(JSON.stringify({
    type: 'chat-joined',
    streamId,
    timestamp: new Date().toISOString(),
  }));

  // Broadcast user joined (optional, for viewer count)
  broadcastToStream(streamId, {
    type: 'user-joined',
    userId,
    timestamp: new Date().toISOString(),
  }, userId);

  console.log(`[CHAT] User ${userId} joined chat for stream ${streamId}`);
}

/**
 * Leave live stream chat
 */
export function leaveStreamChat(streamId: string, userId: string): void {
  const connections = streamChatConnections.get(streamId);
  if (connections) {
    const connection = Array.from(connections).find(c => c.userId === userId);
    if (connection) {
      connections.delete(connection);
      connection.ws.close();
      
      // Broadcast user left
      broadcastToStream(streamId, {
        type: 'user-left',
        userId,
        timestamp: new Date().toISOString(),
      }, userId);

      console.log(`[CHAT] User ${userId} left chat for stream ${streamId}`);
    }
  }
}

/**
 * Send chat message
 */
export async function sendStreamChatMessage(
  streamId: string,
  userId: string,
  message: string
): Promise<void> {
  // Save message to database
  const chatMessage = await prisma.chatMessage.create({
    data: {
      channelId: `live_${streamId}`, // Use stream ID as channel ID
      userId,
      text: message,
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

  // Broadcast message to all viewers
  broadcastToStream(streamId, {
    type: 'chat-message',
    messageId: chatMessage.id,
    userId: chatMessage.userId,
    userHandle: chatMessage.user.handle || chatMessage.user.displayName || 'Anonymous',
    userAvatar: chatMessage.user.avatarUrl,
    text: message,
    timestamp: chatMessage.createdAt.toISOString(),
  });

  // Emit event
  await publishEvent(
    EventTopics.CLIPS,
    EventTypes.CLIP_PUBLISHED, // Reuse or create new event type
    {
      streamId,
      userId,
      messageId: chatMessage.id,
    },
    'chat-service'
  );
}

/**
 * Broadcast message to all viewers of a stream
 */
function broadcastToStream(
  streamId: string,
  message: any,
  excludeUserId?: string
): void {
  const connections = streamChatConnections.get(streamId);
  if (!connections) return;

  const messageJson = JSON.stringify(message);

  for (const connection of connections) {
    if (connection.userId !== excludeUserId) {
      try {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(messageJson);
        }
      } catch (error) {
        console.error(`[CHAT] Error sending message to ${connection.userId}:`, error);
      }
    }
  }
}

/**
 * Get chat connections for a stream
 */
export function getStreamChatConnections(streamId: string): LiveStreamChatConnection[] {
  const connections = streamChatConnections.get(streamId);
  return connections ? Array.from(connections) : [];
}

/**
 * Get viewer count for a stream
 */
export function getStreamViewerCount(streamId: string): number {
  const connections = streamChatConnections.get(streamId);
  return connections ? connections.size : 0;
}

/**
 * Clear all chat connections for a stream (when stream ends)
 */
export function clearStreamChat(streamId: string): void {
  const connections = streamChatConnections.get(streamId);
  if (connections) {
    for (const connection of connections) {
      connection.ws.close();
    }
    streamChatConnections.delete(streamId);
    console.log(`[CHAT] Cleared chat for stream ${streamId}`);
  }
}


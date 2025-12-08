/**
 * Real-time Interactions Handler
 * 
 * Phase 7: Live Streaming
 * 
 * Handles real-time interactions during live streams:
 * - Likes
 * - Reactions (emojis)
 * - Viewer count updates
 */

import { WebSocket } from 'ws';
import { prisma } from '@strike/shared-db';
import { publishEvent, EventTopics, EventTypes } from '@strike/shared-utils';

export interface StreamInteraction {
  type: 'like' | 'reaction' | 'viewer-joined' | 'viewer-left';
  userId: string;
  streamId: string;
  timestamp: Date;
  data?: {
    reaction?: string; // Emoji
    count?: number; // For aggregated interactions
  };
}

// Store active interaction connections
const streamInteractionConnections = new Map<string, Set<WebSocket>>();

// Store interaction counts per stream
const streamInteractionCounts = new Map<string, {
  likes: number;
  reactions: Map<string, number>; // emoji -> count
  viewers: number;
}>();

/**
 * Join stream interactions
 */
export function joinStreamInteractions(streamId: string, ws: WebSocket): void {
  if (!streamInteractionConnections.has(streamId)) {
    streamInteractionConnections.set(streamId, new Set());
    streamInteractionCounts.set(streamId, {
      likes: 0,
      reactions: new Map(),
      viewers: 0,
    });
  }

  streamInteractionConnections.get(streamId)!.add(ws);

  // Send current counts
  const counts = streamInteractionCounts.get(streamId)!;
  ws.send(JSON.stringify({
    type: 'interaction-stats',
    streamId,
    likes: counts.likes,
    reactions: Object.fromEntries(counts.reactions),
    viewers: counts.viewers,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Leave stream interactions
 */
export function leaveStreamInteractions(streamId: string, ws: WebSocket): void {
  const connections = streamInteractionConnections.get(streamId);
  if (connections) {
    connections.delete(ws);
  }
}

/**
 * Handle like interaction
 */
export async function handleLikeInteraction(
  streamId: string,
  userId: string
): Promise<void> {
  const counts = streamInteractionCounts.get(streamId);
  if (!counts) return;

  counts.likes += 1;

  // Broadcast to all viewers
  broadcastInteraction(streamId, {
    type: 'like',
    userId,
    streamId,
    timestamp: new Date(),
    data: { count: counts.likes },
  });

  // Emit event
  await publishEvent(
    EventTopics.ANALYTICS,
    EventTypes.CLIP_VIEWED, // Reuse or create new event type
    {
      streamId,
      userId,
      interactionType: 'like',
    },
    'streaming-ingest-service'
  );
}

/**
 * Handle reaction interaction
 */
export async function handleReactionInteraction(
  streamId: string,
  userId: string,
  reaction: string
): Promise<void> {
  const counts = streamInteractionCounts.get(streamId);
  if (!counts) return;

  const currentCount = counts.reactions.get(reaction) || 0;
  counts.reactions.set(reaction, currentCount + 1);

  // Broadcast to all viewers
  broadcastInteraction(streamId, {
    type: 'reaction',
    userId,
    streamId,
    timestamp: new Date(),
    data: {
      reaction,
      count: currentCount + 1,
    },
  });

  // Emit event
  await publishEvent(
    EventTopics.ANALYTICS,
    EventTypes.CLIP_VIEWED,
    {
      streamId,
      userId,
      interactionType: 'reaction',
      reaction,
    },
    'streaming-ingest-service'
  );
}

/**
 * Update viewer count
 */
export function updateViewerCount(streamId: string, count: number): void {
  const counts = streamInteractionCounts.get(streamId);
  if (!counts) return;

  counts.viewers = count;

  // Broadcast to all viewers
  broadcastInteraction(streamId, {
    type: 'viewer-count',
    userId: 'system',
    streamId,
    timestamp: new Date(),
    data: { count },
  });
}

/**
 * Broadcast interaction to all viewers
 */
function broadcastInteraction(streamId: string, interaction: StreamInteraction): void {
  const connections = streamInteractionConnections.get(streamId);
  if (!connections) return;

  const message = JSON.stringify({
    type: 'interaction',
    ...interaction,
    timestamp: interaction.timestamp.toISOString(),
  });

  for (const ws of connections) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    } catch (error) {
      console.error(`[INTERACTIONS] Error broadcasting to stream ${streamId}:`, error);
    }
  }
}

/**
 * Get interaction stats for a stream
 */
export function getStreamInteractionStats(streamId: string): {
  likes: number;
  reactions: Record<string, number>;
  viewers: number;
} {
  const counts = streamInteractionCounts.get(streamId);
  if (!counts) {
    return { likes: 0, reactions: {}, viewers: 0 };
  }

  return {
    likes: counts.likes,
    reactions: Object.fromEntries(counts.reactions),
    viewers: counts.viewers,
  };
}

/**
 * Clear interactions for a stream
 */
export function clearStreamInteractions(streamId: string): void {
  const connections = streamInteractionConnections.get(streamId);
  if (connections) {
    for (const ws of connections) {
      ws.close();
    }
    streamInteractionConnections.delete(streamId);
  }
  streamInteractionCounts.delete(streamId);
}


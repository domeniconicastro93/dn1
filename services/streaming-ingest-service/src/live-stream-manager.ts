/**
 * Live Stream Manager
 * 
 * Phase 7: Live Streaming
 * 
 * Manages live stream lifecycle, WebRTC ingest, and HLS conversion
 */

import { prisma } from '@strike/shared-db';
import { createIngestPeerConnection, closeIngestConnection, getIngestConnection } from './webrtc-ingest';
import { startHLSPipeline, stopHLSPipeline, getHLSPipeline } from './hls-pipeline';
import { WebSocket } from 'ws';

export interface LiveStreamConfig {
  streamId: string;
  creatorId: string;
  title: string;
  gameId: string;
  quality: '720p' | '1080p' | '1440p' | '4K';
  bitrate: number;
}

/**
 * Start live stream
 */
export async function startLiveStream(
  config: LiveStreamConfig,
  ws: WebSocket
): Promise<{ streamId: string; ingestUrl: string; hlsUrl: string }> {
  // Create or update LiveStream in database
  let liveStream = await prisma.liveStream.findUnique({
    where: { id: config.streamId },
  });

  if (!liveStream) {
    liveStream = await prisma.liveStream.create({
      data: {
        id: config.streamId,
        title: config.title,
        gameId: config.gameId,
        creatorId: config.creatorId,
        isLive: true,
        viewerCount: 0,
      },
    });
  } else {
    liveStream = await prisma.liveStream.update({
      where: { id: config.streamId },
      data: {
        isLive: true,
        startedAt: new Date(),
      },
    });
  }

  // Create WebRTC ingest connection
  const peerConnection = createIngestPeerConnection(
    config.streamId,
    config.creatorId,
    ws
  );

  // Start HLS pipeline
  const connection = getIngestConnection(config.streamId);
  if (connection) {
    const hlsPipeline = await startHLSPipeline(config.streamId, connection);
    
    return {
      streamId: config.streamId,
      ingestUrl: `ws://${process.env.STREAMING_HOST || 'localhost'}:${process.env.WS_PORT || '3014'}/ingest?streamId=${config.streamId}`,
      hlsUrl: hlsPipeline.playlistUrl,
    };
  }

  throw new Error('Failed to create ingest connection');
}

/**
 * Stop live stream
 */
export async function stopLiveStream(streamId: string): Promise<void> {
  // Stop HLS pipeline
  stopHLSPipeline(streamId);

  // Close WebRTC ingest connection
  closeIngestConnection(streamId);

  // Update database
  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      isLive: false,
      endedAt: new Date(),
    },
  });

  console.log(`[LIVE] Stream ${streamId} stopped`);
}

/**
 * Get live stream status
 */
export async function getLiveStreamStatus(streamId: string): Promise<{
  isLive: boolean;
  viewerCount: number;
  hlsUrl?: string;
  ingestStats?: {
    bitrate: number;
    fps: number;
    bytesReceived: number;
  };
}> {
  const liveStream = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });

  if (!liveStream) {
    throw new Error('Live stream not found');
  }

  const ingestConnection = getIngestConnection(streamId);
  const hlsPipeline = getHLSPipeline(streamId);

  return {
    isLive: liveStream.isLive,
    viewerCount: liveStream.viewerCount,
    hlsUrl: hlsPipeline?.playlistUrl,
    ingestStats: ingestConnection ? {
      bitrate: ingestConnection.stats.bitrate,
      fps: ingestConnection.stats.fps,
      bytesReceived: ingestConnection.stats.bytesReceived,
    } : undefined,
  };
}

/**
 * Update viewer count
 */
export async function updateViewerCount(streamId: string, count: number): Promise<void> {
  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      viewerCount: count,
    },
  });
}


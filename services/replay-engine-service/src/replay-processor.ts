/**
 * Replay Processor
 * 
 * Handles replay extraction, encoding, and upload.
 * Processes SaveReplay requests asynchronously.
 */

import { sessionBufferManager } from './circular-buffer';
import { getNVENCConfig, generateFFmpegNVENCArgs } from './nvenc-config';
import { uploadReplayVideo } from './storage-upload';
import { publishEvent, EventTopics, EventTypes } from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type { BufferChunk } from './circular-buffer';

export interface ReplayJob {
  replayId: string;
  sessionId: string;
  userId: string;
  gameId: string;
  fromSeconds?: number;
  toSeconds?: number;
  qualityPreset: 'low' | 'medium' | 'high';
  status: 'queued' | 'extracting' | 'encoding' | 'uploading' | 'ready' | 'failed';
  progress: number; // 0-100
  storageUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job store (TODO: Replace with database/queue in production)
class ReplayJobStore {
  private jobs: Map<string, ReplayJob> = new Map();

  createJob(job: ReplayJob): void {
    this.jobs.set(job.replayId, job);
  }

  getJob(replayId: string): ReplayJob | null {
    return this.jobs.get(replayId) || null;
  }

  updateJob(replayId: string, updates: Partial<ReplayJob>): ReplayJob | null {
    const job = this.jobs.get(replayId);
    if (!job) return null;

    const updated = {
      ...job,
      ...updates,
      updatedAt: new Date(),
    };
    this.jobs.set(replayId, updated);
    return updated;
  }

  getAllJobs(): ReplayJob[] {
    return Array.from(this.jobs.values());
  }
}

export const replayJobStore = new ReplayJobStore();

/**
 * Process replay save request
 * 
 * 1. Extract chunks from circular buffer
 * 2. Encode to MP4 using NVENC
 * 3. Upload to object storage
 * 4. Emit ReplayCreated event
 */
export async function processReplaySave(
  replayId: string,
  sessionId: string,
  userId: string,
  gameId: string,
  fromSeconds?: number,
  toSeconds?: number,
  qualityPreset: 'low' | 'medium' | 'high' = 'high'
): Promise<ReplayJob> {
  // Create job
  const job: ReplayJob = {
    replayId,
    sessionId,
    userId,
    gameId,
    fromSeconds,
    toSeconds,
    qualityPreset,
    status: 'queued',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  replayJobStore.createJob(job);

  // Process asynchronously
  processReplayAsync(job).catch((error) => {
    console.error(`Error processing replay ${replayId}:`, error);
    replayJobStore.updateJob(replayId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      progress: 0,
    });
  });

  return job;
}

async function processReplayAsync(job: ReplayJob): Promise<void> {
  const { replayId, sessionId, fromSeconds, toSeconds, qualityPreset } = job;

  try {
    // Step 1: Extract chunks from buffer
    replayJobStore.updateJob(replayId, { status: 'extracting', progress: 10 });

    const buffer = sessionBufferManager.getBuffer(sessionId);
    
    // Master Prompt Section 8: Extract last 90-120s (default 120s, can be 90s)
    // Default to 120s if not specified, but allow 90s minimum
    const defaultToSeconds = toSeconds || 120;
    const defaultFromSeconds = fromSeconds || 0;
    
    // Ensure we extract at least 90s (Master Prompt requirement)
    const minDuration = 90;
    const actualToSeconds = Math.max(defaultToSeconds, minDuration);
    
    let chunks = buffer.extractChunks(
      defaultFromSeconds,
      actualToSeconds
    );

    if (chunks.length === 0) {
      throw new Error('No chunks found in buffer for the specified time range');
    }

    console.log(`[REPLAY] Extracted ${chunks.length} chunks for replay ${replayId} (${defaultFromSeconds}s to ${actualToSeconds}s)`);

    // Step 2: Encode to MP4 using NVENC
    replayJobStore.updateJob(replayId, { status: 'encoding', progress: 30 });

    // Get game streaming settings to determine FPS
    let targetFps = 60; // Default
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { targetFps: true },
      });
      if (game?.targetFps) {
        targetFps = game.targetFps as 60 | 120 | 240;
      }
    } catch (error) {
      console.warn(`[REPLAY] Could not fetch game FPS, using default 60fps:`, error);
    }

    // Get NVENC config with game-specific FPS
    // Master Prompt Section 8: Preset P1 or P2 (low-latency)
    // Use P1 preset for low-latency-high-quality (can be changed to P2 for lower latency)
    const nvencConfig = getNVENCConfig(targetFps, qualityPreset, 'H264', 'P1');

    // Master Prompt Section 8: "ensures GOP alignment where possible"
    // Align chunks to GOP boundaries before encoding
    const alignedChunks = alignToGOP(chunks, nvencConfig.gop);

    // In production, this would:
    // 1. Write chunks to temporary memory location
    // 2. Use FFmpeg/GStreamer with NVENC to encode
    // 3. Output MP4 to memory buffer
    // For Phase 4, we simulate this process

    const encodedVideo = await encodeChunksToMP4(alignedChunks, nvencConfig);

    console.log(`[REPLAY] Encoded ${encodedVideo.length} bytes for replay ${replayId}`);

    // Step 3: Upload to object storage
    replayJobStore.updateJob(replayId, { status: 'uploading', progress: 70 });

    const storageUrl = await uploadToStorage(replayId, encodedVideo, gameId, userId);

    // Step 4: Update database record
    await prisma.replay.update({
      where: { id: replayId },
      data: {
        status: 'READY',
        storageUrl,
      },
    });

    // Step 5: Update job as ready
    replayJobStore.updateJob(replayId, {
      status: 'ready',
      progress: 100,
      storageUrl,
    });

    // Step 6: Calculate duration from extracted chunks
    const duration = calculateReplayDuration(chunks);

    // Step 7: Emit ReplayCreated event (Master Prompt Section 8)
    await emitReplayCreatedEvent(replayId, storageUrl, sessionId, userId, gameId, duration);

    console.log(`[REPLAY] Replay ${replayId} processed successfully: ${storageUrl} (duration: ${duration}s)`);
  } catch (error) {
    console.error(`[REPLAY] Error processing replay ${replayId}:`, error);
    
    // Update database record
    await prisma.replay.update({
      where: { id: replayId },
      data: {
        status: 'FAILED',
      },
    });

    // Update job store
    replayJobStore.updateJob(replayId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Emit ReplayFailed event
    await publishEvent(
      EventTopics.REPLAYS,
      EventTypes.REPLAY_FAILED,
      {
        replayId,
        sessionId,
        userId,
        gameId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'replay-engine-service'
    );

    throw error;
  }
}

/**
 * Encode chunks to MP4 using NVENC
 * 
 * In production, this would use FFmpeg/GStreamer with actual NVENC hardware encoding.
 * For Phase 6, we simulate the encoding process.
 */
async function encodeChunksToMP4(
  chunks: BufferChunk[],
  nvencConfig: ReturnType<typeof getNVENCConfig>
): Promise<Buffer> {
  // TODO: In production, use FFmpeg/GStreamer with NVENC
  // Example FFmpeg command:
  // ffmpeg -f h264 -i pipe:0 -c:v h264_nvenc -preset P1 -rc cbr -b:v 15000k -g 120 -f mp4 output.mp4
  //
  // For Phase 6, we simulate by:
  // 1. Concatenating chunks
  // 2. Adding MP4 container headers
  // 3. Returning as Buffer

  console.log(`[ENCODE] Encoding ${chunks.length} chunks with NVENC config:`, {
    preset: nvencConfig.preset,
    bitrate: `${nvencConfig.bitrate}k`,
    gop: nvencConfig.gop,
    codec: nvencConfig.codec,
  });

  // Simulate encoding delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Concatenate chunks (in production, this would be done by FFmpeg/GStreamer)
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const encoded = Buffer.alloc(totalSize);
  let offset = 0;

  for (const chunk of chunks) {
    chunk.data.copy(encoded, offset);
    offset += chunk.data.length;
  }

  // In production, this would be a properly encoded MP4 file
  // For Phase 6, we return the concatenated buffer
  return encoded;
}

/**
 * Upload encoded video to object storage
 * 
 * Uses S3-compatible storage upload.
 */
async function uploadToStorage(
  replayId: string,
  videoData: Buffer,
  gameId: string,
  userId: string
): Promise<string> {
  return await uploadReplayVideo(replayId, videoData, gameId, userId);
}

/**
 * Emit ReplayCreated event
 * 
 * Publishes to event bus (Kafka/NATS in production).
 * 
 * Master Prompt Section 8 requires:
 * - userId
 * - sessionId
 * - gameId
 * - fileUrl (storageUrl)
 * - duration
 */
async function emitReplayCreatedEvent(
  replayId: string,
  storageUrl: string,
  sessionId: string,
  userId: string,
  gameId: string,
  duration: number // Duration in seconds
): Promise<void> {
  await publishEvent(
    EventTopics.REPLAYS,
    EventTypes.REPLAY_CREATED,
    {
      replayId,
      fileUrl: storageUrl, // Master Prompt uses 'fileUrl'
      sessionId,
      userId,
      gameId,
      duration, // Required by Master Prompt
    },
    'replay-engine-service'
  );
}

/**
 * Calculate replay duration from chunks
 * 
 * Duration is calculated as the time difference between the oldest and newest chunk.
 */
function calculateReplayDuration(chunks: BufferChunk[]): number {
  if (chunks.length === 0) {
    return 0;
  }

  const oldestTimestamp = chunks[0].timestamp;
  const newestTimestamp = chunks[chunks.length - 1].timestamp;
  const durationMs = newestTimestamp - oldestTimestamp;
  const durationSeconds = Math.ceil(durationMs / 1000);

  return durationSeconds;
}

/**
 * Ensure GOP alignment when extracting buffer chunks
 * 
 * Master Prompt Section 8: "ensures GOP alignment where possible"
 * This function ensures we start extraction at a keyframe (GOP boundary).
 */
function alignToGOP(chunks: BufferChunk[], gopSize: number): BufferChunk[] {
  if (chunks.length === 0) {
    return chunks;
  }

  // Find the first keyframe (assuming first chunk is a keyframe or we track keyframes)
  // In production, we would parse NAL units to find keyframes
  // For Phase 4, we assume chunks are already aligned or we align to sequence boundaries
  
  // Simple alignment: start from a chunk that is at a GOP boundary
  // In production, this would parse H.264/HEVC NAL units to find IDR frames
  
  // For now, return chunks as-is (GOP alignment would be handled by FFmpeg/GStreamer)
  return chunks;
}

/**
 * Get replay job status
 */
export function getReplayStatus(replayId: string): ReplayJob | null {
  return replayJobStore.getJob(replayId);
}


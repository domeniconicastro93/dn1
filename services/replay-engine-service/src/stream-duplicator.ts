/**
 * Stream Duplicator
 * 
 * Duplicates encoded video stream:
 * - Path A → Client (WebRTC)
 * - Path B → Circular buffer (for replay)
 * 
 * Zero disk I/O - all operations in RAM.
 * High-performance pipeline.
 * 
 * Frame duplication rules (as per Master Prompt):
 * - Never duplicate frames at encoder
 * - Keep smooth 60fps
 * - Drop frames if needed before encoding to avoid spikes
 */

import { sessionBufferManager } from './circular-buffer';
import { FrameHandler } from './frame-handler';

/**
 * Stream Duplicator for a session
 * 
 * Receives encoded video chunks and:
 * 1. Forwards to client (via WebRTC)
 * 2. Stores in circular buffer (for replay)
 */
export class StreamDuplicator {
  private sessionId: string;
  private active: boolean = false;
  private frameHandler: FrameHandler;
  private targetFps: number = 60;

  constructor(sessionId: string, targetFps: number = 60) {
    this.sessionId = sessionId;
    this.targetFps = targetFps;
    this.frameHandler = new FrameHandler(targetFps);
  }

  /**
   * Start duplicating stream
   */
  start(): void {
    this.active = true;
    console.log(`[STREAM] Started stream duplication for session ${this.sessionId}`);
  }

  /**
   * Process incoming encoded video chunk
   * 
   * Applies frame duplication prevention rules:
   * - Never duplicate frames at encoder
   * - Keep smooth FPS
   * - Drop frames if needed before encoding to avoid spikes
   * 
   * @param chunk - Encoded video chunk (H.264/HEVC NAL units)
   * @param timestamp - Frame timestamp in milliseconds
   * @param sequenceNumber - Frame sequence number
   * @param isKeyframe - Whether this is a keyframe
   */
  processChunk(
    chunk: Buffer,
    timestamp: number = Date.now(),
    sequenceNumber: number = 0,
    isKeyframe: boolean = false
  ): void {
    if (!this.active) {
      return;
    }

    // Create frame info for deduplication
    const frameInfo = {
      timestamp,
      sequenceNumber,
      isKeyframe,
      data: chunk,
    };

    // Apply frame duplication prevention
    const processedFrame = this.frameHandler.processFrame(frameInfo);

    if (!processedFrame) {
      // Frame was dropped (duplicate or rate-limited)
      return;
    }

    // Path A: Forward to client (via WebRTC)
    // This would be handled by the streaming service
    // For now, we just log it
    // TODO: Forward to WebRTC peer connection

    // Path B: Store in circular buffer (only non-duplicate frames)
    const buffer = sessionBufferManager.getBuffer(this.sessionId);
    buffer.addChunk(processedFrame.data);

    // Log buffer stats periodically
    const stats = buffer.getStats();
    if (stats.chunkCount % 100 === 0) {
      const frameStats = this.frameHandler.getStats();
      console.log(`[STREAM] Buffer stats for ${this.sessionId}:`, {
        chunks: stats.chunkCount,
        sizeMB: (stats.totalSizeBytes / 1024 / 1024).toFixed(2),
        durationSeconds: stats.durationSeconds,
        framesProcessed: frameStats.deduplicator.totalFramesProcessed,
        targetFps: frameStats.targetFps,
      });
    }
  }

  /**
   * Stop duplicating stream
   */
  stop(): void {
    this.active = false;
    console.log(`[STREAM] Stopped stream duplication for session ${this.sessionId}`);
  }

  /**
   * Check if duplicator is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Set target FPS for frame rate control
   */
  setTargetFps(fps: number): void {
    this.targetFps = fps;
    this.frameHandler.setTargetFps(fps);
  }

  /**
   * Get frame handler statistics
   */
  getFrameStats() {
    return this.frameHandler.getStats();
  }
}

/**
 * Per-session stream duplicator manager
 */
class StreamDuplicatorManager {
  private duplicators: Map<string, StreamDuplicator> = new Map();

  getDuplicator(sessionId: string, targetFps: number = 60): StreamDuplicator {
    if (!this.duplicators.has(sessionId)) {
      const duplicator = new StreamDuplicator(sessionId, targetFps);
      this.duplicators.set(sessionId, duplicator);
      duplicator.start();
    }
    return this.duplicators.get(sessionId)!;
  }

  removeDuplicator(sessionId: string): void {
    const duplicator = this.duplicators.get(sessionId);
    if (duplicator) {
      duplicator.stop();
      this.duplicators.delete(sessionId);
      // Also remove buffer when session ends
      sessionBufferManager.removeBuffer(sessionId);
    }
  }

  getAllSessionIds(): string[] {
    return Array.from(this.duplicators.keys());
  }
}

export const streamDuplicatorManager = new StreamDuplicatorManager();

/**
 * Initialize stream duplication for a session
 * 
 * This should be called when a session starts streaming.
 */
export function initializeStreamDuplication(sessionId: string): void {
  const duplicator = streamDuplicatorManager.getDuplicator(sessionId);
  console.log(`[STREAM] Initialized stream duplication for session ${sessionId}`);
}

/**
 * Stop stream duplication for a session
 * 
 * This should be called when a session ends.
 */
export function stopStreamDuplication(sessionId: string): void {
  streamDuplicatorManager.removeDuplicator(sessionId);
  console.log(`[STREAM] Stopped stream duplication for session ${sessionId}`);
}

/**
 * Process video chunk (called by streaming service when receiving encoded stream)
 * 
 * @param sessionId - Session ID
 * @param chunk - Encoded video chunk
 * @param timestamp - Frame timestamp (optional, defaults to now)
 * @param sequenceNumber - Frame sequence number (optional)
 * @param isKeyframe - Whether this is a keyframe (optional)
 */
export function processVideoChunk(
  sessionId: string,
  chunk: Buffer,
  timestamp?: number,
  sequenceNumber?: number,
  isKeyframe?: boolean
): void {
  const duplicator = streamDuplicatorManager.getDuplicator(sessionId);
  duplicator.processChunk(chunk, timestamp, sequenceNumber, isKeyframe);
}


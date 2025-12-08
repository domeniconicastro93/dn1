/**
 * Circular RAM Buffer for Replay Engine
 * 
 * Maintains a 120-second circular buffer of encoded video stream in RAM.
 * Zero disk I/O in hot path - all operations are in-memory.
 * 
 * In production, this would use FFmpeg/GStreamer with ring buffer.
 */

export interface BufferChunk {
  timestamp: number; // Unix timestamp in milliseconds
  data: Buffer; // Encoded video chunk (H.264/HEVC NAL units)
  sequenceNumber: number; // Sequential chunk number
}

export interface CircularBufferConfig {
  durationSeconds: number; // Default 120 seconds
  maxSizeBytes: number; // Maximum buffer size in bytes
  chunkSizeBytes: number; // Size of each chunk
}

/**
 * Circular Buffer Manager
 * 
 * Maintains a ring buffer of the last N seconds of video.
 * Old chunks are automatically discarded when buffer is full.
 */
export class CircularBuffer {
  private chunks: BufferChunk[] = [];
  private config: CircularBufferConfig;
  private startTime: number = Date.now();
  private sequenceNumber: number = 0;
  private totalSizeBytes: number = 0;

  constructor(config: Partial<CircularBufferConfig> = {}) {
    // Master Prompt Section 8: "circular buffer in RAM of last 90-120s"
    // Default to 120s, but allow 90s minimum
    const durationSeconds = config.durationSeconds || 120;
    const minDuration = 90;
    const maxDuration = 120;
    
    this.config = {
      durationSeconds: Math.max(minDuration, Math.min(maxDuration, durationSeconds)),
      maxSizeBytes: config.maxSizeBytes || 500 * 1024 * 1024, // 500 MB default
      chunkSizeBytes: config.chunkSizeBytes || 64 * 1024, // 64 KB chunks
    };
  }

  /**
   * Add a chunk to the buffer
   * Automatically removes old chunks that exceed duration or size limits
   */
  addChunk(data: Buffer): void {
    const now = Date.now();
    const chunk: BufferChunk = {
      timestamp: now,
      data,
      sequenceNumber: this.sequenceNumber++,
    };

    this.chunks.push(chunk);
    this.totalSizeBytes += data.length;

    // Remove chunks that are older than durationSeconds
    const cutoffTime = now - this.config.durationSeconds * 1000;
    while (
      this.chunks.length > 0 &&
      this.chunks[0].timestamp < cutoffTime
    ) {
      const removed = this.chunks.shift();
      if (removed) {
        this.totalSizeBytes -= removed.data.length;
      }
    }

    // Remove chunks if total size exceeds maxSizeBytes
    while (
      this.totalSizeBytes > this.config.maxSizeBytes &&
      this.chunks.length > 0
    ) {
      const removed = this.chunks.shift();
      if (removed) {
        this.totalSizeBytes -= removed.data.length;
      }
    }
  }

  /**
   * Extract chunks within time range [fromSeconds, toSeconds] relative to now
   * Returns all chunks in the specified window
   */
  extractChunks(fromSeconds: number = 0, toSeconds?: number): BufferChunk[] {
    const now = Date.now();
    const fromTime = now - (toSeconds || this.config.durationSeconds) * 1000;
    const toTime = now - fromSeconds * 1000;

    return this.chunks.filter(
      (chunk) => chunk.timestamp >= fromTime && chunk.timestamp <= toTime
    );
  }

  /**
   * Extract all chunks in buffer (last N seconds)
   */
  extractAllChunks(): BufferChunk[] {
    return [...this.chunks];
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    chunkCount: number;
    totalSizeBytes: number;
    durationSeconds: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    return {
      chunkCount: this.chunks.length,
      totalSizeBytes: this.totalSizeBytes,
      durationSeconds: this.config.durationSeconds,
      oldestTimestamp: this.chunks[0]?.timestamp || null,
      newestTimestamp: this.chunks[this.chunks.length - 1]?.timestamp || null,
    };
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.chunks = [];
    this.totalSizeBytes = 0;
    this.sequenceNumber = 0;
    this.startTime = Date.now();
  }
}

/**
 * Per-session buffer manager
 * Each active session has its own circular buffer
 */
class SessionBufferManager {
  private buffers: Map<string, CircularBuffer> = new Map();

  getBuffer(sessionId: string): CircularBuffer {
    if (!this.buffers.has(sessionId)) {
      this.buffers.set(sessionId, new CircularBuffer({ durationSeconds: 120 }));
    }
    return this.buffers.get(sessionId)!;
  }

  removeBuffer(sessionId: string): void {
    this.buffers.delete(sessionId);
  }

  getAllSessionIds(): string[] {
    return Array.from(this.buffers.keys());
  }
}

export const sessionBufferManager = new SessionBufferManager();


/**
 * Frame Handling and Duplication Prevention
 * 
 * Implements frame duplication rules as per Master Prompt:
 * - Never duplicate frames at encoder
 * - Keep smooth 60fps
 * - Drop frames if needed before encoding to avoid spikes
 */

export interface FrameInfo {
  timestamp: number; // Unix timestamp in milliseconds
  sequenceNumber: number; // Sequential frame number
  isKeyframe: boolean; // Whether this is a keyframe
  data: Buffer; // Frame data
}

/**
 * Frame deduplication handler
 * 
 * Ensures no duplicate frames are sent to encoder.
 * Tracks frame timestamps and sequence numbers.
 */
export class FrameDeduplicator {
  private lastFrameTimestamp: number = 0;
  private lastSequenceNumber: number = 0;
  private frameHistory: Map<number, FrameInfo> = new Map();
  private maxHistorySize: number = 100; // Keep last 100 frames for reference

  /**
   * Process frame and check for duplicates
   * Returns frame if valid, null if duplicate
   */
  processFrame(frame: FrameInfo): FrameInfo | null {
    // Check for duplicate timestamp
    if (frame.timestamp === this.lastFrameTimestamp) {
      console.warn(`[FRAME] Duplicate timestamp detected: ${frame.timestamp}, dropping frame`);
      return null;
    }

    // Check for duplicate sequence number
    if (frame.sequenceNumber === this.lastSequenceNumber) {
      console.warn(`[FRAME] Duplicate sequence number detected: ${frame.sequenceNumber}, dropping frame`);
      return null;
    }

    // Check if frame is in history (exact duplicate)
    if (this.frameHistory.has(frame.sequenceNumber)) {
      const existingFrame = this.frameHistory.get(frame.sequenceNumber)!;
      if (existingFrame.timestamp === frame.timestamp) {
        console.warn(`[FRAME] Exact duplicate frame detected: ${frame.sequenceNumber}, dropping frame`);
        return null;
      }
    }

    // Frame is valid, update state
    this.lastFrameTimestamp = frame.timestamp;
    this.lastSequenceNumber = frame.sequenceNumber;

    // Add to history
    this.frameHistory.set(frame.sequenceNumber, frame);

    // Clean up old history entries
    if (this.frameHistory.size > this.maxHistorySize) {
      const oldestSequence = Math.min(...Array.from(this.frameHistory.keys()));
      this.frameHistory.delete(oldestSequence);
    }

    return frame;
  }

  /**
   * Reset deduplicator state
   */
  reset(): void {
    this.lastFrameTimestamp = 0;
    this.lastSequenceNumber = 0;
    this.frameHistory.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalFramesProcessed: number;
    lastTimestamp: number;
    lastSequenceNumber: number;
  } {
    return {
      totalFramesProcessed: this.lastSequenceNumber,
      lastTimestamp: this.lastFrameTimestamp,
      lastSequenceNumber: this.lastSequenceNumber,
    };
  }
}

/**
 * Frame rate controller
 * 
 * Ensures smooth frame rate by dropping frames if needed
 * to maintain target FPS without spikes.
 */
export class FrameRateController {
  private targetFps: number;
  private frameInterval: number; // milliseconds between frames
  private lastFrameTime: number = 0;

  constructor(targetFps: number = 60) {
    this.targetFps = targetFps;
    this.frameInterval = 1000 / targetFps; // e.g., 16.67ms for 60fps
  }

  /**
   * Check if frame should be processed based on frame rate
   * Returns true if frame should be processed, false if it should be dropped
   */
  shouldProcessFrame(timestamp: number): boolean {
    const now = timestamp;
    const timeSinceLastFrame = now - this.lastFrameTime;

    // If enough time has passed, process frame
    if (timeSinceLastFrame >= this.frameInterval) {
      this.lastFrameTime = now;
      return true;
    }

    // Frame arrived too early, drop it to maintain smooth FPS
    console.debug(`[FRAME] Dropping frame to maintain ${this.targetFps} FPS (interval: ${timeSinceLastFrame}ms < ${this.frameInterval}ms)`);
    return false;
  }

  /**
   * Reset controller
   */
  reset(): void {
    this.lastFrameTime = 0;
  }

  /**
   * Set target FPS
   */
  setTargetFps(fps: number): void {
    this.targetFps = fps;
    this.frameInterval = 1000 / fps;
  }
}

/**
 * Combined frame handler
 * 
 * Applies both deduplication and frame rate control
 */
export class FrameHandler {
  private deduplicator: FrameDeduplicator;
  private rateController: FrameRateController;

  constructor(targetFps: number = 60) {
    this.deduplicator = new FrameDeduplicator();
    this.rateController = new FrameRateController(targetFps);
  }

  /**
   * Process frame with deduplication and rate control
   * Returns frame if valid and should be processed, null otherwise
   */
  processFrame(frame: FrameInfo): FrameInfo | null {
    // First check frame rate
    if (!this.rateController.shouldProcessFrame(frame.timestamp)) {
      return null; // Dropped for rate control
    }

    // Then check for duplicates
    return this.deduplicator.processFrame(frame);
  }

  /**
   * Reset handlers
   */
  reset(): void {
    this.deduplicator.reset();
    this.rateController.reset();
  }

  /**
   * Set target FPS
   */
  setTargetFps(fps: number): void {
    this.rateController.setTargetFps(fps);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      deduplicator: this.deduplicator.getStats(),
      targetFps: this.rateController['targetFps'],
    };
  }
}


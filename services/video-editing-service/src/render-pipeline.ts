/**
 * Render Pipeline
 * 
 * Full server-side rendering pipeline:
 * 1. Download replay video from storage
 * 2. Apply trimming
 * 3. Apply filters and overlays (texts, stickers)
 * 4. Mix audio (with ducking)
 * 5. Encode final output 1080x1920, H.264 or HEVC
 * 6. Generate thumbnail
 * 7. Upload to storage
 */

import type { EditInstructionsDTO, RenderRequestDTO } from '@strike/shared-types';
import { buildLayers } from './layer-manager';
import { buildAudioMix, generateAudioFilterComplex } from './audio-ducking';
import {
  getVideoDimensions,
  getSafeArea,
  adjustToSafeArea,
  calculateFontSize,
  normalizedToPixels,
} from './coordinate-system';
import { uploadRenderedVideo, uploadRenderedThumbnail } from './storage-upload';
import { generateThumbnail as generateThumbnailFromVideo, type ThumbnailConfig } from './thumbnail-generator';
import { publishEvent, EventTopics, EventTypes } from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';

export interface RenderJob {
  renderId: string;
  replayId: string;
  userId: string;
  instructions: EditInstructionsDTO;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  progress: number; // 0-100
  videoUrl?: string;
  thumbnailUrl?: string;
  reelId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job store (TODO: Replace with database/queue in production)
class RenderJobStore {
  private jobs: Map<string, RenderJob> = new Map();

  createJob(job: RenderJob): void {
    this.jobs.set(job.renderId, job);
  }

  getJob(renderId: string): RenderJob | null {
    return this.jobs.get(renderId) || null;
  }

  updateJob(renderId: string, updates: Partial<RenderJob>): RenderJob | null {
    const job = this.jobs.get(renderId);
    if (!job) return null;

    const updated = {
      ...job,
      ...updates,
      updatedAt: new Date(),
    };
    this.jobs.set(renderId, updated);
    return updated;
  }

  getAllJobs(): RenderJob[] {
    return Array.from(this.jobs.values());
  }
}

export const renderJobStore = new RenderJobStore();

/**
 * Process render request
 */
export async function processRender(
  renderId: string,
  userId: string,
  request: RenderRequestDTO
): Promise<RenderJob> {
  const { replayId, instructions } = request;

  // Create job
  const job: RenderJob = {
    renderId,
    replayId,
    userId,
    instructions,
    status: 'queued',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  renderJobStore.createJob(job);

  // Process asynchronously
  processRenderAsync(job).catch((error) => {
    console.error(`Error processing render ${renderId}:`, error);
    renderJobStore.updateJob(renderId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      progress: 0,
    });
  });

  return job;
}

async function processRenderAsync(job: RenderJob): Promise<void> {
  const { renderId, replayId, instructions } = job;

  try {
    // Step 1: Ingest job - validate JSON and fetch source video (Master Prompt Section 9)
    renderJobStore.updateJob(renderId, { status: 'processing', progress: 10 });

    // Validate instructions (already validated by API, but double-check here)
    if (!instructions.replayId) {
      throw new Error('replayId is required');
    }
    if (!instructions.outputFormat) {
      throw new Error('outputFormat is required');
    }

    // Download replay video from storage
    const replayVideo = await downloadReplayVideo(replayId);
    console.log(`[RENDER] Downloaded replay ${replayId} (${replayVideo.length} bytes)`);

    // Step 2: Compose timeline - apply trim and build layers (Master Prompt Section 9)
    renderJobStore.updateJob(renderId, { progress: 20 });

    const layers = buildLayers(instructions);
    const dimensions = getVideoDimensions(instructions.outputFormat);
    const safeArea = getSafeArea(instructions.outputFormat);

    console.log(`[RENDER] Built ${layers.length} layers for ${instructions.outputFormat}`);

    // Step 3: Audio pipeline - combine game audio with music, apply ducking (Master Prompt Section 9)
    renderJobStore.updateJob(renderId, { progress: 30 });

    const audioMix = buildAudioMix(instructions);
    const audioFilter = generateAudioFilterComplex(audioMix);

    console.log(`[RENDER] Built audio mix with ${audioMix.layers.length} layers`);

    // Step 4: Render - apply filters, overlays, and audio using FFmpeg/GStreamer (Master Prompt Section 9)
    renderJobStore.updateJob(renderId, { progress: 50 });

    const renderedVideo = await applyLayersAndAudio(
      replayVideo,
      layers,
      audioFilter,
      dimensions,
      safeArea,
      instructions
    );

    console.log(`[RENDER] Rendered video (${renderedVideo.length} bytes)`);

    // Step 5: Generate thumbnail - pick best frame or mid-frame (Master Prompt Section 9)
    renderJobStore.updateJob(renderId, { progress: 70 });

    // Use mid-frame (50% of duration) or 1 second, whichever is appropriate
    const duration = calculateVideoDuration(instructions);
    const thumbnailTimestamp = Math.min(1.0, duration / 2); // Mid-frame or 1s, whichever is smaller
    
    const thumbnail = await generateThumbnailFromVideo(renderedVideo, dimensions, {
      timestamp: thumbnailTimestamp,
    });

    console.log(`[RENDER] Generated thumbnail (${thumbnail.length} bytes) at ${thumbnailTimestamp}s`);

    // Step 6: Upload - final video + thumbnail to object storage (Master Prompt Section 9)
    renderJobStore.updateJob(renderId, { progress: 80 });

    const videoUrl = await uploadRenderedVideo(renderId, renderedVideo, instructions.outputFormat);
    const thumbnailUrl = await uploadRenderedThumbnail(renderId, thumbnail);

    console.log(`[RENDER] Uploaded to storage: ${videoUrl}`);

    // Step 7: Update database record
    await prisma.renderJob.update({
      where: { id: renderId },
      data: {
        status: 'READY',
        videoUrl,
        thumbnailUrl,
        progress: 100,
        completedAt: new Date(),
      },
    });

    // Step 8: Update job store
    renderJobStore.updateJob(renderId, {
      status: 'ready',
      progress: 100,
      videoUrl,
      thumbnailUrl,
    });

    // Step 9: Calculate duration and resolution
    const duration = calculateVideoDuration(instructions);
    const resolution = `${dimensions.width}x${dimensions.height}`;

    // Step 10: Emit RenderCompleted event (Master Prompt Section 9)
    await emitRenderCompletedEvent(
      renderId,
      videoUrl,
      thumbnailUrl,
      replayId,
      job.userId,
      duration,
      resolution
    );

    console.log(`[RENDER] Render ${renderId} completed successfully (${duration}s, ${resolution})`);
  } catch (error) {
    console.error(`[RENDER] Error processing render ${renderId}:`, error);
    
    // Update database record
    await prisma.renderJob.update({
      where: { id: renderId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // Update job store
    renderJobStore.updateJob(renderId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Emit RenderFailed event
    await publishEvent(
      EventTopics.RENDERS,
      EventTypes.RENDER_FAILED,
      {
        renderId,
        replayId,
        userId: job.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'video-editing-service'
    );

    throw error;
  }
}

/**
 * Download replay video from storage
 */
async function downloadReplayVideo(replayId: string): Promise<Buffer> {
  // TODO: In production, download from S3-compatible storage
  // Example: await s3.getObject({ Bucket: 'strike-replays', Key: `replays/${replayId}.mp4` })

  const storageBaseUrl = process.env.STORAGE_BASE_URL || 'https://storage.strike.gg';
  const replayUrl = `${storageBaseUrl}/replays/${replayId}.mp4`;

  console.log(`[DOWNLOAD] Downloading replay from ${replayUrl}`);

  // Simulate download
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In production, use fetch or S3 SDK
  // const response = await fetch(replayUrl);
  // return Buffer.from(await response.arrayBuffer());

  // For Phase 7, return mock buffer
  return Buffer.alloc(1024 * 1024); // 1 MB mock
}

/**
 * Apply layers and audio to video
 * 
 * In production, this would use FFmpeg/GStreamer with:
 * - Video filters for color correction
 * - Overlay filters for stickers and text
 * - Audio filter complex for ducking
 */
async function applyLayersAndAudio(
  videoData: Buffer,
  layers: ReturnType<typeof buildLayers>,
  audioFilter: string,
  dimensions: { width: number; height: number },
  safeArea: ReturnType<typeof getSafeArea>,
  instructions: EditInstructionsDTO
): Promise<Buffer> {
  console.log(`[RENDER] Applying ${layers.length} layers to video`);

  // Process each layer type
  for (const layer of layers) {
    switch (layer.type) {
      case 'filter':
        // Apply color filter/LUT
        console.log(`[RENDER] Applying filter: ${(layer.data as any).name}`);
        break;

      case 'sticker':
        // Apply sticker overlay
        const sticker = layer.data as EditInstructionsDTO['stickers'][0];
        const stickerPos = adjustToSafeArea(sticker.position, instructions.outputFormat);
        const stickerPixels = normalizedToPixels(stickerPos, dimensions);
        console.log(
          `[RENDER] Applying sticker ${sticker.name} at (${stickerPixels.x}, ${stickerPixels.y})`
        );
        break;

      case 'text':
        // Apply text overlay
        const text = layer.data as EditInstructionsDTO['texts'][0];
        const textPos = adjustToSafeArea(text.position, instructions.outputFormat);
        const textPixels = normalizedToPixels(textPos, dimensions);
        const fontSize = calculateFontSize(text.fontSizeRelative, dimensions.height);
        console.log(
          `[RENDER] Applying text "${text.text}" at (${textPixels.x}, ${textPixels.y}) with size ${fontSize}px`
        );
        break;
    }
  }

  // In production, this would generate FFmpeg command:
  // ffmpeg -i input.mp4 \
  //   -vf "scale=1080:1920,format=yuv420p,overlay=...text=...:fontsize=...:fontcolor=..." \
  //   -af "volume=0.5[game];volume=1.0[music];[game][music]amix=inputs=2" \
  //   -c:v libx264 -preset medium -crf 23 \
  //   -c:a aac -b:a 192k \
  //   output.mp4

  // Simulate rendering delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // For Phase 7, return mock rendered video
  return Buffer.alloc(2 * 1024 * 1024); // 2 MB mock
}

/**
 * Generate thumbnail from video
 * 
 * Uses thumbnail generator module.
 */
async function generateThumbnail(
  videoData: Buffer,
  dimensions: { width: number; height: number }
): Promise<Buffer> {
  return await generateThumbnailFromVideo(videoData, dimensions);
}

/**
 * Upload rendered video to storage
 * 
 * Uses storage upload module.
 */
async function uploadVideo(
  renderId: string,
  videoData: Buffer,
  outputFormat: 'vertical_1080x1920' | 'horizontal_1920x1080'
): Promise<string> {
  return await uploadRenderedVideo(renderId, videoData, outputFormat);
}

/**
 * Upload thumbnail to storage
 * 
 * Uses storage upload module.
 */
async function uploadThumbnail(renderId: string, thumbnailData: Buffer): Promise<string> {
  return await uploadRenderedThumbnail(renderId, thumbnailData);
}

/**
 * Calculate video duration from edit instructions
 * 
 * Duration is calculated from trim settings or default to full replay duration.
 */
function calculateVideoDuration(instructions: EditInstructionsDTO): number {
  if (instructions.trim?.start !== undefined && instructions.trim?.end !== undefined) {
    return instructions.trim.end - instructions.trim.start;
  }
  
  // Default duration (would be fetched from replay metadata in production)
  return 120; // 120 seconds default
}

/**
 * Emit RenderCompleted event
 * 
 * Publishes to event bus (Kafka/NATS in production).
 * 
 * Master Prompt Section 9 requires:
 * - clipId (reelId)
 * - finalUrl (videoUrl)
 * - thumbnailUrl
 * - duration
 * - resolution
 */
async function emitRenderCompletedEvent(
  renderId: string,
  videoUrl: string,
  thumbnailUrl: string,
  replayId: string,
  userId: string,
  duration: number,
  resolution: string
): Promise<void> {
  await publishEvent(
    EventTopics.RENDERS,
    EventTypes.RENDER_COMPLETED,
    {
      clipId: renderId, // Master Prompt uses 'clipId' (alias for reelId)
      reelId: renderId, // Also include reelId for compatibility
      finalUrl: videoUrl, // Master Prompt uses 'finalUrl' (not 'videoUrl')
      thumbnailUrl,
      duration, // Required by Master Prompt
      resolution, // Required by Master Prompt (e.g., "1080x1920")
      replayId,
      userId,
    },
    'video-editing-service'
  );
}

/**
 * Get render job status
 */
export function getRenderStatus(renderId: string): RenderJob | null {
  return renderJobStore.getJob(renderId);
}


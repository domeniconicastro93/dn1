/**
 * FFmpeg Pipeline for HLS Conversion
 * 
 * Phase 7: Live Streaming
 * 
 * Converts WebRTC stream to HLS format for distribution
 */

import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { WebRTCIngestConnection } from './webrtc-ingest';

export interface HLSPipeline {
  streamId: string;
  process: any; // FFmpeg process
  outputDir: string;
  playlistUrl: string;
  segmentUrl: string;
  startedAt: Date;
  status: 'starting' | 'running' | 'stopped' | 'error';
}

// Store active HLS pipelines
const activePipelines = new Map<string, HLSPipeline>();

const HLS_OUTPUT_DIR = process.env.HLS_OUTPUT_DIR || './hls-output';
const HLS_SEGMENT_DURATION = 2; // 2 seconds per segment
const HLS_PLAYLIST_SIZE = 6; // Keep 6 segments in playlist (12 seconds)

/**
 * Start FFmpeg pipeline to convert WebRTC stream to HLS
 */
export async function startHLSPipeline(
  streamId: string,
  connection: WebRTCIngestConnection
): Promise<HLSPipeline> {
  const outputDir = join(HLS_OUTPUT_DIR, streamId);
  
  // Create output directory
  await mkdir(outputDir, { recursive: true });

  // FFmpeg command to convert WebRTC stream to HLS
  // In production, this would receive video/audio from MediaStream
  // For now, using a placeholder command
  const ffmpegArgs = [
    // Input (WebRTC stream - would be replaced with actual stream URL)
    '-f', 'lavfi',
    '-i', 'testsrc2=size=1920x1080:rate=30', // Placeholder test source
    
    // Video encoding (H.264)
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-b:v', '4000k',
    '-maxrate', '4000k',
    '-bufsize', '8000k',
    '-g', '60', // GOP size (2 seconds at 30fps)
    '-keyint_min', '60',
    '-sc_threshold', '0',
    '-r', '30', // Frame rate
    
    // Audio encoding (AAC)
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '48000',
    '-ac', '2',
    
    // HLS output
    '-f', 'hls',
    '-hls_time', HLS_SEGMENT_DURATION.toString(),
    '-hls_list_size', HLS_PLAYLIST_SIZE.toString(),
    '-hls_flags', 'delete_segments+independent_segments',
    '-hls_segment_filename', join(outputDir, 'segment_%03d.ts'),
    '-master_pl_name', 'master.m3u8',
    join(outputDir, 'playlist.m3u8'),
  ];

  // Spawn FFmpeg process
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Handle FFmpeg output
  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`[HLS] FFmpeg stdout for ${streamId}:`, data.toString());
  });

  ffmpegProcess.stderr.on('data', (data) => {
    // FFmpeg logs to stderr
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error(`[HLS] FFmpeg error for ${streamId}:`, output);
    }
  });

  ffmpegProcess.on('error', (error) => {
    console.error(`[HLS] FFmpeg process error for ${streamId}:`, error);
    const pipeline = activePipelines.get(streamId);
    if (pipeline) {
      pipeline.status = 'error';
    }
  });

  ffmpegProcess.on('exit', (code) => {
    console.log(`[HLS] FFmpeg process exited for ${streamId} with code ${code}`);
    const pipeline = activePipelines.get(streamId);
    if (pipeline) {
      pipeline.status = 'stopped';
    }
  });

  // Get HLS URLs
  const hlsBaseUrl = process.env.HLS_BASE_URL || 'http://localhost:8080/hls';
  const playlistUrl = `${hlsBaseUrl}/${streamId}/playlist.m3u8`;
  const segmentUrl = `${hlsBaseUrl}/${streamId}/segment_%03d.ts`;

  const pipeline: HLSPipeline = {
    streamId,
    process: ffmpegProcess,
    outputDir,
    playlistUrl,
    segmentUrl,
    startedAt: new Date(),
    status: 'running',
  };

  activePipelines.set(streamId, pipeline);

  console.log(`[HLS] Pipeline started for stream ${streamId}`);
  console.log(`[HLS] Playlist URL: ${playlistUrl}`);

  return pipeline;
}

/**
 * Stop HLS pipeline
 */
export function stopHLSPipeline(streamId: string): void {
  const pipeline = activePipelines.get(streamId);
  if (pipeline) {
    pipeline.process.kill('SIGTERM');
    pipeline.status = 'stopped';
    activePipelines.delete(streamId);
    console.log(`[HLS] Pipeline stopped for stream ${streamId}`);
  }
}

/**
 * Get HLS pipeline
 */
export function getHLSPipeline(streamId: string): HLSPipeline | undefined {
  return activePipelines.get(streamId);
}

/**
 * Get all active HLS pipelines
 */
export function getAllHLSPipelines(): HLSPipeline[] {
  return Array.from(activePipelines.values());
}

/**
 * Generate master playlist for multi-bitrate streaming
 */
export async function generateMasterPlaylist(
  streamId: string,
  variants: Array<{ resolution: string; bitrate: string; playlistUrl: string }>
): Promise<string> {
  const outputDir = join(HLS_OUTPUT_DIR, streamId);
  const masterPlaylistPath = join(outputDir, 'master.m3u8');

  let masterPlaylist = '#EXTM3U\n';
  masterPlaylist += '#EXT-X-VERSION:3\n';
  masterPlaylist += '#EXT-X-INDEPENDENT-SEGMENTS\n\n';

  for (const variant of variants) {
    masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bitrate},RESOLUTION=${variant.resolution}\n`;
    masterPlaylist += `${variant.playlistUrl}\n\n`;
  }

  await writeFile(masterPlaylistPath, masterPlaylist);
  return masterPlaylist;
}


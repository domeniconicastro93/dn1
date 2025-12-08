/**
 * Audio Ducking
 * 
 * Implements audio mixing with ducking rules:
 * - Game audio (base)
 * - Music track (optional)
 * - Voiceover (future)
 * 
 * Policy: If music track present, duck game audio to 30-50% volume
 */

import type { EditInstructionsDTO } from '@strike/shared-types';

export interface AudioLayer {
  type: 'game' | 'music' | 'voiceover';
  source: string; // URL or file path
  gain: number; // 0-1, where 1 = 100% volume
  startTime?: number; // seconds
  endTime?: number; // seconds
}

export interface AudioMixConfig {
  layers: AudioLayer[];
  outputGain: number; // Master volume (0-1)
}

/**
 * Build audio mix configuration from edit instructions
 */
export function buildAudioMix(
  instructions: EditInstructionsDTO
): AudioMixConfig {
  const layers: AudioLayer[] = [];

  // Game audio (base layer)
  if (instructions.audio?.useGameAudio !== false) {
    const gameAudioGain =
      instructions.audio?.ducking?.gameAudioGain ?? 0.5; // Default 50% if music present

    layers.push({
      type: 'game',
      source: `replay:${instructions.replayId}`, // Reference to replay audio
      gain: instructions.audio?.musicTrackId ? gameAudioGain : 1.0, // Full volume if no music
    });
  }

  // Music track (optional)
  if (instructions.audio?.musicTrackId) {
    const musicGain = instructions.audio.ducking?.musicGain ?? 1.0;

    layers.push({
      type: 'music',
      source: `music:${instructions.audio.musicTrackId}`, // Reference to music library
      gain: musicGain,
    });
  }

  return {
    layers,
    outputGain: 1.0, // Master volume
  };
}

/**
 * Generate FFmpeg audio filter complex for ducking
 * 
 * Example:
 * [0:a]volume=0.5[game];[1:a]volume=1.0[music];[game][music]amix=inputs=2:duration=longest
 */
export function generateAudioFilterComplex(
  config: AudioMixConfig
): string {
  const filters: string[] = [];
  const inputs: string[] = [];

  for (let i = 0; i < config.layers.length; i++) {
    const layer = config.layers[i];
    const label = layer.type;

    // Volume filter
    filters.push(`[${i}:a]volume=${layer.gain}[${label}]`);
    inputs.push(`[${label}]`);
  }

  // Mix all audio layers
  if (inputs.length > 1) {
    filters.push(
      `${inputs.join('')}amix=inputs=${inputs.length}:duration=longest[outa]`
    );
  } else {
    filters.push(`${inputs[0]}volume=${config.outputGain}[outa]`);
  }

  return filters.join(';');
}

/**
 * Generate GStreamer audio pipeline for ducking
 */
export function generateAudioPipeline(
  config: AudioMixConfig
): string {
  const elements: string[] = [];

  // Input sources
  for (const layer of config.layers) {
    if (layer.type === 'game') {
      elements.push('audiomixer name=mixer');
      elements.push(`volume volume=${layer.gain}`);
    } else if (layer.type === 'music') {
      elements.push(`volume volume=${layer.gain}`);
      elements.push('mixer.');
    }
  }

  // Output
  elements.push('audioconvert');
  elements.push('audioresample');
  elements.push('avenc_aac bitrate=192000');

  return elements.join(' ! ');
}


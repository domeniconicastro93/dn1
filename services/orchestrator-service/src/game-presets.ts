/**
 * Per-Game Streaming Presets - Database-backed Implementation
 * 
 * Each game can override default streaming settings:
 * - targetResolution (1080p, 1440p, 4K)
 * - targetFPS (60, 120, 240)
 * - bitrateRange (min, max in kbps)
 * - encoderPreset (NVENC low-latency)
 * - maxConcurrentSessionsPerVM
 */

import { prisma } from '@strike/shared-db';

export interface GameStreamingPreset {
  gameId: string;
  targetResolution: '1080p' | '1440p' | '4K';
  targetFPS: 60 | 120 | 240;
  bitrateRange: {
    min: number; // kbps
    max: number; // kbps
  };
  encoderPreset: string; // e.g., 'nvenc-low-latency-hq'
  maxConcurrentSessionsPerVM?: number; // Override template default
}

/**
 * Get streaming settings for a game from database
 * Returns game-specific preset or default
 */
export async function getGameStreamingSettings(
  gameId: string
): Promise<GameStreamingPreset> {
  // Get game from database
  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    // Return default preset if game not found
    return getDefaultPreset('standard');
  }

  // Build preset from game database fields
  const preset: GameStreamingPreset = {
    gameId: game.id,
    targetResolution: (game.targetResolution as '1080p' | '1440p' | '4K') || '1080p',
    targetFPS: (game.targetFps as 60 | 120 | 240) || 60,
    bitrateRange: (game.bitrateRange as { min: number; max: number }) || {
      min: 8000,
      max: 15000,
    },
    encoderPreset: game.encoderPreset || 'nvenc-low-latency',
    maxConcurrentSessionsPerVM: game.maxConcurrentSessionsPerVm || undefined,
  };

  return preset;
}

/**
 * Get default preset by type
 */
function getDefaultPreset(type: 'standard' | 'high' | 'competitive'): GameStreamingPreset {
  switch (type) {
    case 'high':
      return {
        gameId: 'default-high',
        targetResolution: '1440p',
        targetFPS: 120,
        bitrateRange: { min: 15000, max: 25000 },
        encoderPreset: 'nvenc-low-latency-hq',
        maxConcurrentSessionsPerVM: 2,
      };
    case 'competitive':
      return {
        gameId: 'default-competitive',
        targetResolution: '1080p',
        targetFPS: 240,
        bitrateRange: { min: 10000, max: 20000 },
        encoderPreset: 'nvenc-ultra-low-latency',
        maxConcurrentSessionsPerVM: 1,
      };
    case 'standard':
    default:
      return {
        gameId: 'default-standard',
        targetResolution: '1080p',
        targetFPS: 60,
        bitrateRange: { min: 8000, max: 15000 },
        encoderPreset: 'nvenc-low-latency',
        maxConcurrentSessionsPerVM: 4,
      };
  }
}

/**
 * Select appropriate VM template based on game preset
 */
export async function selectVMTemplateForGame(
  gameId: string,
  availableTemplates: Array<{ id: string; gpuType: string; maxConcurrentSessions: number }>
): Promise<string | null> {
  const preset = await getGameStreamingSettings(gameId);

  // Find template that can support the game's requirements
  for (const template of availableTemplates) {
    // Check if template can support the game's max concurrent sessions
    if (
      preset.maxConcurrentSessionsPerVM &&
      template.maxConcurrentSessions >= preset.maxConcurrentSessionsPerVM
    ) {
      // Prefer higher-end GPUs for high-resolution/high-FPS games
      if (preset.targetResolution === '4K' || preset.targetFPS >= 120) {
        if (
          template.gpuType.includes('A16') ||
          template.gpuType.includes('A10') ||
          template.gpuType.includes('RTX-4090') ||
          template.gpuType.includes('RTX-4080')
        ) {
          return template.id;
        }
      }
      // For standard games, any template works
      return template.id;
    }
  }

  // Fallback to first available template
  return availableTemplates[0]?.id || null;
}

/**
 * Update game streaming preset in database
 */
export async function updateGameStreamingPreset(
  gameId: string,
  preset: Partial<GameStreamingPreset>
): Promise<void> {
  await prisma.game.update({
    where: { id: gameId },
    data: {
      ...(preset.targetResolution && { targetResolution: preset.targetResolution }),
      ...(preset.targetFPS && { targetFps: preset.targetFPS }),
      ...(preset.bitrateRange && { bitrateRange: preset.bitrateRange as any }),
      ...(preset.encoderPreset && { encoderPreset: preset.encoderPreset }),
      ...(preset.maxConcurrentSessionsPerVM && {
        maxConcurrentSessionsPerVm: preset.maxConcurrentSessionsPerVM,
      }),
    },
  });
}

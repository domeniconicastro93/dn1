/**
 * Layer Manager
 * 
 * Manages layering order for video composition:
 * 1. Base video (trimmed clip from replay)
 * 2. Color filters / LUTs
 * 3. Stickers and emojis
 * 4. Text overlays and captions
 * 5. UI or brand overlays (if any)
 */

import type { EditInstructionsDTO } from '@strike/shared-types';

export type LayerType =
  | 'base-video'
  | 'filter'
  | 'sticker'
  | 'text'
  | 'overlay';

export interface Layer {
  type: LayerType;
  zIndex: number; // Higher = on top
  startTime: number; // seconds
  endTime: number; // seconds
  data: unknown; // Layer-specific data
}

/**
 * Get layering order (Z-index)
 * Higher number = rendered on top
 */
export function getLayerZIndex(layerType: LayerType): number {
  const zIndexMap: Record<LayerType, number> = {
    'base-video': 0,
    filter: 1,
    sticker: 2,
    text: 3,
    overlay: 4,
  };
  return zIndexMap[layerType];
}

/**
 * Build layers from edit instructions
 */
export function buildLayers(
  instructions: EditInstructionsDTO
): Layer[] {
  const layers: Layer[] = [];

  // 1. Base video layer
  layers.push({
    type: 'base-video',
    zIndex: getLayerZIndex('base-video'),
    startTime: instructions.trim?.start || 0,
    endTime: instructions.trim?.end || 120,
    data: {
      replayId: instructions.replayId,
      trim: instructions.trim,
    },
  });

  // 2. Color filters
  if (instructions.filters && instructions.filters.length > 0) {
    for (const filter of instructions.filters) {
      layers.push({
        type: 'filter',
        zIndex: getLayerZIndex('filter'),
        startTime: 0, // Filters apply to entire video
        endTime: instructions.trim?.end || 120,
        data: filter,
      });
    }
  }

  // 3. Stickers
  if (instructions.stickers && instructions.stickers.length > 0) {
    for (let i = 0; i < instructions.stickers.length; i++) {
      const sticker = instructions.stickers[i];
      layers.push({
        type: 'sticker',
        zIndex: getLayerZIndex('sticker') + i, // Stickers can overlap
        startTime: sticker.startTime,
        endTime: sticker.endTime,
        data: sticker,
      });
    }
  }

  // 4. Text overlays
  if (instructions.texts && instructions.texts.length > 0) {
    for (let i = 0; i < instructions.texts.length; i++) {
      const text = instructions.texts[i];
      layers.push({
        type: 'text',
        zIndex: getLayerZIndex('text') + i, // Texts can overlap
        startTime: text.startTime,
        endTime: text.endTime,
        data: text,
      });
    }
  }

  // Sort by z-index and start time
  return layers.sort((a, b) => {
    if (a.zIndex !== b.zIndex) {
      return a.zIndex - b.zIndex;
    }
    return a.startTime - b.startTime;
  });
}

/**
 * Get layers active at a specific time
 */
export function getLayersAtTime(layers: Layer[], time: number): Layer[] {
  return layers.filter(
    (layer) => time >= layer.startTime && time <= layer.endTime
  );
}


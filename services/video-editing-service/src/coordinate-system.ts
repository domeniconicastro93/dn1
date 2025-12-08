/**
 * Coordinate System & Safe Areas
 * 
 * Implements normalized coordinates [0-1] and safe area handling
 * for vertical video (1080x1920) and horizontal video (1920x1080).
 */

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface NormalizedPosition {
  x: number; // 0-1, where 0 = left, 1 = right
  y: number; // 0-1, where 0 = top, 1 = bottom
}

export interface SafeArea {
  top: number; // Margin from top (0-1)
  bottom: number; // Margin from bottom (0-1)
  left: number; // Margin from left (0-1)
  right: number; // Margin from right (0-1)
}

/**
 * Get safe area for output format
 * Safe areas prevent content from being hidden by UI overlays
 */
export function getSafeArea(
  outputFormat: 'vertical_1080x1920' | 'horizontal_1920x1080'
): SafeArea {
  if (outputFormat === 'vertical_1080x1920') {
    // Vertical video safe areas (mobile)
    // Top: avoid notch/status bar
    // Bottom: avoid navigation bar/home indicator
    return {
      top: 0.05, // 5% from top
      bottom: 0.1, // 10% from bottom
      left: 0.0, // No side margins needed
      right: 0.0,
    };
  } else {
    // Horizontal video safe areas (desktop/web)
    return {
      top: 0.05,
      bottom: 0.05,
      left: 0.05,
      right: 0.05,
    };
  }
}

/**
 * Convert normalized position to pixel coordinates
 */
export function normalizedToPixels(
  normalized: NormalizedPosition,
  dimensions: VideoDimensions
): { x: number; y: number } {
  return {
    x: Math.round(normalized.x * dimensions.width),
    y: Math.round(normalized.y * dimensions.height),
  };
}

/**
 * Convert pixel coordinates to normalized position
 */
export function pixelsToNormalized(
  pixels: { x: number; y: number },
  dimensions: VideoDimensions
): NormalizedPosition {
  return {
    x: pixels.x / dimensions.width,
    y: pixels.y / dimensions.height,
  };
}

/**
 * Check if position is within safe area
 */
export function isWithinSafeArea(
  position: NormalizedPosition,
  outputFormat: 'vertical_1080x1920' | 'horizontal_1920x1080'
): boolean {
  const safeArea = getSafeArea(outputFormat);

  return (
    position.x >= safeArea.left &&
    position.x <= 1 - safeArea.right &&
    position.y >= safeArea.top &&
    position.y <= 1 - safeArea.bottom
  );
}

/**
 * Adjust position to be within safe area
 */
export function adjustToSafeArea(
  position: NormalizedPosition,
  outputFormat: 'vertical_1080x1920' | 'horizontal_1920x1080'
): NormalizedPosition {
  const safeArea = getSafeArea(outputFormat);

  return {
    x: Math.max(safeArea.left, Math.min(1 - safeArea.right, position.x)),
    y: Math.max(safeArea.top, Math.min(1 - safeArea.bottom, position.y)),
  };
}

/**
 * Get video dimensions for output format
 */
export function getVideoDimensions(
  outputFormat: 'vertical_1080x1920' | 'horizontal_1920x1080'
): VideoDimensions {
  if (outputFormat === 'vertical_1080x1920') {
    return { width: 1080, height: 1920 };
  } else {
    return { width: 1920, height: 1080 };
  }
}

/**
 * Calculate font size in pixels from relative size
 * fontSizeRelative is relative to video height (e.g., 0.05 = 5% of height)
 */
export function calculateFontSize(
  fontSizeRelative: number,
  videoHeight: number
): number {
  return Math.round(fontSizeRelative * videoHeight);
}


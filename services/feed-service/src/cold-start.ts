/**
 * Cold Start Logic
 * 
 * Handles recommendations for:
 * - New content (no engagement data yet)
 * - New users (no interaction history)
 */

import type { ClipDTO } from '@strike/shared-types';

export interface ColdStartBoost {
  contentBoost: number; // Boost for new content
  userBoost: number; // Boost for new users
}

/**
 * Calculate cold start boost for new content
 * 
 * Uses prior averages by:
 * - Game category
 * - Creator quality segment
 * - Language
 */
export function calculateContentColdStartBoost(
  clip: ClipDTO,
  gameAverages: Record<string, number>, // gameId -> average score
  creatorAverages: Record<string, number>, // creatorId -> average score
  languageAverages: Record<string, number> // language -> average score
): number {
  // Use prior averages as baseline
  const gameAvg = gameAverages[clip.gameId] || 0.5;
  const creatorAvg = creatorAverages[clip.creatorId] || 0.5;
  const languageAvg = languageAverages[clip.language || 'en'] || 0.5;

  // Weighted average
  const baseline = (gameAvg * 0.4 + creatorAvg * 0.4 + languageAvg * 0.2);

  // Small initial boost to test content
  const initialBoost = 0.1;

  return baseline + initialBoost;
}

/**
 * Calculate cold start boost for new users
 * 
 * Uses:
 * - Popularity baseline (trending content)
 * - Region/language matching
 * - Early interactions (if any)
 */
export function calculateUserColdStartBoost(
  userLocale: string,
  userRegion?: string,
  earlyInteractions: string[] = [] // clipIds user interacted with
): {
  popularityWeight: number;
  localeWeight: number;
  interactionWeight: number;
} {
  // Popularity baseline (high weight for new users)
  const popularityWeight = 0.6;

  // Region/language matching (medium weight)
  const localeWeight = 0.3;

  // Early interactions (low weight initially, increases with interactions)
  const interactionWeight = Math.min(earlyInteractions.length * 0.1, 0.1);

  return {
    popularityWeight,
    localeWeight,
    interactionWeight,
  };
}

/**
 * Get popularity baseline for content
 * 
 * Based on trending metrics (views, likes, shares in last 24h)
 */
export function getPopularityBaseline(clip: ClipDTO): number {
  // Simplified popularity score
  // In production, would use time-decayed metrics
  const views = clip.views || 0;
  const likes = clip.likes || 0;
  const shares = clip.shares || 0;

  // Weighted popularity
  const popularity = (views * 0.1 + likes * 0.5 + shares * 1.0) / 1000;

  return Math.min(popularity, 1.0);
}

/**
 * Apply cold start logic to content score
 * 
 * Master Prompt Section 11:
 * - For new content: Use prior averages by game, creator quality segment, language. Small initial boost to test content.
 * - For new users: Rely on popularity baseline, region/language, early interactions.
 */
export function applyColdStart(
  baseScore: number,
  clip: ClipDTO,
  isNewContent: boolean,
  isNewUser: boolean,
  gameAverages: Record<string, number> = {},
  creatorAverages: Record<string, number> = {},
  languageAverages: Record<string, number> = {}
): number {
  let adjustedScore = baseScore;

  // Boost for new content (Master Prompt: "prior averages by game, creator quality segment, language")
  if (isNewContent) {
    const contentBoost = calculateContentColdStartBoost(
      clip,
      gameAverages,
      creatorAverages,
      languageAverages
    );
    // Master Prompt: "small initial boost to test content"
    adjustedScore = Math.max(adjustedScore, contentBoost);
  }

  // Boost for new users (Master Prompt: "rely on popularity baseline, region/language, early interactions")
  if (isNewUser) {
    const popularity = getPopularityBaseline(clip);
    // Blend with popularity (Master Prompt: "popularity baseline")
    adjustedScore = adjustedScore * 0.5 + popularity * 0.5;
  }

  return adjustedScore;
}


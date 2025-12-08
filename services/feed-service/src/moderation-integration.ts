/**
 * Moderation Service Integration
 * 
 * Fetches creator quality scores and trust scores from moderation service
 * to use in recommendation engine.
 */

export interface CreatorModerationScores {
  creatorId: string;
  qualityScore: number; // 0-1
  trustScore: number; // 0-1
}

// In-memory cache (fallback if Redis not available)
class ModerationScoresCache {
  private cache: Map<string, CreatorModerationScores> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private cacheTTL = 3600 * 1000; // 1 hour

  set(creatorId: string, scores: CreatorModerationScores): void {
    this.cache.set(creatorId, scores);
    this.cacheExpiry.set(creatorId, Date.now() + this.cacheTTL);
  }

  get(creatorId: string): CreatorModerationScores | null {
    const expiry = this.cacheExpiry.get(creatorId);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(creatorId);
      this.cacheExpiry.delete(creatorId);
      return null;
    }
    return this.cache.get(creatorId) || null;
  }

  getAll(creatorIds: string[]): Map<string, CreatorModerationScores> {
    const result = new Map<string, CreatorModerationScores>();
    for (const creatorId of creatorIds) {
      const scores = this.get(creatorId);
      if (scores) {
        result.set(creatorId, scores);
      }
    }
    return result;
  }
}

export const moderationScoresCache = new ModerationScoresCache();

/**
 * Fetch creator moderation scores from moderation service
 */
export async function fetchCreatorModerationScores(
  creatorId: string
): Promise<CreatorModerationScores> {
  // Check Redis cache first
  const { getCachedModerationScores, cacheModerationScores } = await import('./redis-ranking');
  const cached = await getCachedModerationScores(creatorId);
  if (cached) {
    return {
      creatorId,
      qualityScore: cached.qualityScore,
      trustScore: cached.trustScore,
    };
  }

  // Check in-memory cache (fallback)
  const memoryCached = moderationScoresCache.get(creatorId);
  if (memoryCached) {
    return memoryCached;
  }

  // TODO: In production, call moderation-service API
  // const moderationUrl = process.env.MODERATION_SERVICE_URL || 'http://localhost:3013';
  // const response = await fetch(`${moderationUrl}/api/moderation/v1/creator/${creatorId}/scores`);
  // const data = await response.json();

  // For Phase 6, return default scores
  const scores: CreatorModerationScores = {
    creatorId,
    qualityScore: 0.8, // Default quality score
    trustScore: 0.8, // Default trust score
  };

  // Cache in Redis
  await cacheModerationScores(creatorId, {
    qualityScore: scores.qualityScore,
    trustScore: scores.trustScore,
  });

  // Cache in memory (fallback)
  moderationScoresCache.set(creatorId, scores);

  return scores;
}

/**
 * Fetch moderation scores for multiple creators (batch)
 */
export async function fetchCreatorModerationScoresBatch(
  creatorIds: string[]
): Promise<Map<string, CreatorModerationScores>> {
  const result = new Map<string, CreatorModerationScores>();
  const uncachedIds: string[] = [];

  // Check Redis cache first (batch)
  const { getCachedModerationScoresBatch, cacheModerationScores } = await import('./redis-ranking');
  const redisCached = await getCachedModerationScoresBatch(creatorIds);
  for (const [creatorId, scores] of redisCached.entries()) {
    result.set(creatorId, {
      creatorId,
      qualityScore: scores.qualityScore,
      trustScore: scores.trustScore,
    });
  }

  // Check in-memory cache for remaining
  for (const creatorId of creatorIds) {
    if (!result.has(creatorId)) {
      const cached = moderationScoresCache.get(creatorId);
      if (cached) {
        result.set(creatorId, cached);
      } else {
        uncachedIds.push(creatorId);
      }
    }
  }

  // Fetch uncached creators
  if (uncachedIds.length > 0) {
    // TODO: In production, batch API call
    // const moderationUrl = process.env.MODERATION_SERVICE_URL || 'http://localhost:3013';
    // const response = await fetch(`${moderationUrl}/api/moderation/v1/creators/batch`, {
    //   method: 'POST',
    //   body: JSON.stringify({ creatorIds: uncachedIds }),
    // });

    // For Phase 6, return default scores
    for (const creatorId of uncachedIds) {
      const scores: CreatorModerationScores = {
        creatorId,
        qualityScore: 0.8,
        trustScore: 0.8,
      };
      result.set(creatorId, scores);

      // Cache in Redis
      await cacheModerationScores(creatorId, {
        qualityScore: scores.qualityScore,
        trustScore: scores.trustScore,
      });

      // Cache in memory (fallback)
      moderationScoresCache.set(creatorId, scores);
    }
  }

  return result;
}


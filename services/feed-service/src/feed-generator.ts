/**
 * Feed Generator
 * 
 * Generates personalized feeds:
 * - For You: Recommendation engine based
 * - Following: Clips from followed creators
 * - Explore: Trending/popular content
 */

import type { ClipDTO, FeedItemDTO, FeedResponseDTO } from '@strike/shared-types';
import {
  gatherContentSignals,
  calculateScore,
  type UserSignals,
  type ScoringWeights,
  DEFAULT_WEIGHTS,
} from './scoring-engine';
import { applyColdStart } from './cold-start';
import { fetchCreatorModerationScoresBatch } from './moderation-integration';
import {
  storeRankedFeed,
  getRankedFeed,
  storeContentScores,
  getCachedUserSignals,
  cacheUserSignals,
} from './redis-ranking';
import { loadRecommendationWeights as loadActiveWeights } from './config-loader';

export interface FeedOptions {
  userId?: string;
  locale?: string;
  pageToken?: string;
  limit?: number;
  sessionContext?: { gameId?: string };
}

/**
 * Generate "For You" feed using recommendation engine
 */
export async function generateForYouFeed(
  candidateClips: ClipDTO[],
  userSignals: UserSignals,
  options: FeedOptions = {},
  weights?: ScoringWeights // If not provided, loads from database
): Promise<FeedResponseDTO> {
  // Load weights from database if not provided (Master Prompt Section 11: configurable weights)
  if (!weights) {
    weights = await loadActiveWeights();
  }
  const limit = options.limit || 20;
  const userId = userSignals.userId;

  // Check Redis cache for ranked feed
  if (userId) {
    const cachedFeed = await getRankedFeed(userId, 'for-you', limit, 0);
    if (cachedFeed.length > 0) {
      // Return cached feed (would need to fetch clip details from database)
      console.log(`[FEED] Using cached ranked feed for user ${userId}`);
      // For Phase 6, we still process but cache the results
    }
  }

  // Fetch moderation scores for all creators (batch)
  const creatorIds = [...new Set(candidateClips.map((clip) => clip.creatorId))];
  const moderationScores = await fetchCreatorModerationScoresBatch(creatorIds);

  // Score all candidate clips
  const scoredClips = candidateClips.map((clip) => {
    const signals = gatherContentSignals(clip, userSignals, options.sessionContext);

    // Apply moderation scores (Master Prompt Section 11: creatorQualityScore, moderation risk)
    const moderation = moderationScores.get(clip.creatorId);
    if (moderation) {
      signals.creatorQualityScore = moderation.qualityScore;
      signals.creatorTrustScore = moderation.trustScore;
      
      // Calculate moderation risk (MR) from trust score
      // MR: 0 = safe, 1 = borderline, 2 = bad
      if (moderation.trustScore < 0.3) {
        signals.moderationRisk = 2; // Bad
      } else if (moderation.trustScore < 0.6) {
        signals.moderationRisk = 1; // Borderline
      } else {
        signals.moderationRisk = 0; // Safe
      }
    }

    let score = calculateScore(signals, weights);

    // Apply cold start if needed
    const isNewContent = (clip.views || 0) < 10; // Less than 10 views = new
    const isNewUser = userSignals.recentWatches.length < 5; // Less than 5 watches = new user

    score = applyColdStart(
      score,
      clip,
      isNewContent,
      isNewUser,
      {}, // TODO: Get game/creator/language averages from database
      {},
      {}
    );

    return {
      clip,
      score,
      signals,
    };
  });

  // Filter out low-quality content (from moderation)
  const filteredClips = scoredClips.filter((item) => {
    const qualityScore = item.signals.creatorQualityScore || 0.5;
    const trustScore = item.signals.creatorTrustScore || 0.5;

    // Filter out low-quality or low-trust content
    if (qualityScore < 0.3 || trustScore < 0.3) {
      return false;
    }

    return true;
  });

  // Sort by score (descending)
  filteredClips.sort((a, b) => b.score - a.score);

  // Apply diversity: ensure variety across creators and games
  const diversifiedClips = applyDiversityFilter(filteredClips, limit);

  // Store ranked feed in Redis
  if (userId) {
    const rankedItems = diversifiedClips.map((item) => ({
      clipId: item.clip.id,
      score: item.score,
    }));
    await storeRankedFeed(userId, 'for-you', rankedItems);
    await storeContentScores(
      userId,
      scoredClips.map((item) => ({
        clipId: item.clip.id,
        score: item.score,
      }))
    );
  }

  // Build feed items
  const items: FeedItemDTO[] = diversifiedClips.map((item) => ({
    type: 'clip' as const,
    clip: item.clip,
    score: item.score,
  }));

  // Generate next page token
  const nextPageToken = items.length >= limit
    ? `page_${Date.now()}_${items.length}`
    : undefined;

  return {
    items,
    nextPageToken,
  };
}

/**
 * Generate "Following" feed (clips from followed creators)
 */
export async function generateFollowingFeed(
  candidateClips: ClipDTO[],
  userSignals: UserSignals,
  options: FeedOptions = {}
): Promise<FeedResponseDTO> {
  const limit = options.limit || 20;

  // Filter clips from followed creators
  const followingClips = candidateClips.filter((clip) =>
    userSignals.followedCreators.includes(clip.creatorId)
  );

  // Sort by recency (newest first)
  followingClips.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  // Limit results
  const limitedClips = followingClips.slice(0, limit);

  const items: FeedItemDTO[] = limitedClips.map((clip) => ({
    type: 'clip' as const,
    clip,
  }));

  const nextPageToken =
    followingClips.length >= limit
      ? `page_${Date.now()}_${items.length}`
      : undefined;

  return {
    items,
    nextPageToken,
  };
}

/**
 * Generate "Explore" feed (trending/popular content)
 */
export async function generateExploreFeed(
  candidateClips: ClipDTO[],
  userSignals: UserSignals,
  options: FeedOptions = {}
): Promise<FeedResponseDTO> {
  const limit = options.limit || 20;
  const locale = options.locale || userSignals.locale;

  // Filter by locale if specified
  let filteredClips = candidateClips;
  if (locale) {
    filteredClips = candidateClips.filter(
      (clip) => !clip.language || clip.language === locale
    );
  }

  // Calculate popularity score (views, likes, shares in last 24h)
  const popularClips = filteredClips.map((clip) => {
    const views = clip.views || 0;
    const likes = clip.likes || 0;
    const shares = clip.shares || 0;
    const comments = clip.comments || 0;

    // Time-decayed popularity (simplified)
    const ageHours = (Date.now() - new Date(clip.createdAt).getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.exp(-ageHours / 24); // Decay over 24 hours

    const popularityScore =
      (views * 0.1 + likes * 0.5 + shares * 1.0 + comments * 0.3) * timeDecay;

    return {
      clip,
      popularityScore,
    };
  });

  // Sort by popularity
  popularClips.sort((a, b) => b.popularityScore - a.popularityScore);

  // Limit results
  const limitedClips = popularClips.slice(0, limit);

  const items: FeedItemDTO[] = limitedClips.map((item) => ({
    type: 'clip' as const,
    clip: item.clip,
    score: item.popularityScore,
  }));

  const nextPageToken =
    popularClips.length >= limit
      ? `page_${Date.now()}_${items.length}`
      : undefined;

  return {
    items,
    nextPageToken,
  };
}

/**
 * Apply diversity filter to ensure variety
 * 
 * Prevents showing too many clips from same creator or game in a row
 */
function applyDiversityFilter(
  scoredClips: Array<{ clip: ClipDTO; score: number; signals: any }>,
  limit: number
): Array<{ clip: ClipDTO; score: number; signals: any }> {
  const diversified: Array<{ clip: ClipDTO; score: number; signals: any }> = [];
  const seenCreators = new Set<string>();
  const seenGames = new Set<string>();

  for (const item of scoredClips) {
    // Allow some repetition but limit it
    const creatorCount = Array.from(seenCreators).filter((id) => id === item.clip.creatorId)
      .length;
    const gameCount = Array.from(seenGames).filter((id) => id === item.clip.gameId).length;

    // Skip if we've seen this creator/game too many times in recent results
    if (creatorCount >= 3 || gameCount >= 5) {
      continue;
    }

    diversified.push(item);
    seenCreators.add(item.clip.creatorId);
    seenGames.add(item.clip.gameId);

    if (diversified.length >= limit) {
      break;
    }
  }

  return diversified;
}

/**
 * Get candidate clips for feed
 * 
 * In production, this would query database with filters
 */
export async function getCandidateClips(
  options: FeedOptions = {}
): Promise<ClipDTO[]> {
  // TODO: In production, query database:
  // - Filter by status: PUBLISHED
  // - Filter by language (if specified)
  // - Exclude hidden/removed content
  // - Limit to recent content (e.g., last 30 days)

  // For Phase 8, return empty array (will be populated by clip-service)
  return [];
}


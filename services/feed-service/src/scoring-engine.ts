/**
 * Recommendation Scoring Engine
 * 
 * Implements the scoring formula with 14 weights as per Master Prompt:
 * score(U,C) = w1*watchTimeRatio + w2*completion + w3*like - w4*dislike 
 *            + w5*share + w6*comment + w7*followedCreator 
 *            + w8*sameGamePreferenceScore + w9*freshnessBoost 
 *            + w10*localeBoost + w11*premiumUserBoost 
 *            + w12*creatorQualityScore 
 *            - w13*repetitionPenalty - w14*diversityPenalty
 */

import type { ClipDTO } from '@strike/shared-types';

export interface UserSignals {
  userId: string;
  locale: string;
  isPremium: boolean;
  followedCreators: string[];
  gamePreferences: Record<string, number>; // gameId -> preference score
  recentWatches: string[]; // clipIds watched recently
  recentCreators: string[]; // creatorIds seen recently
  recentGames: string[]; // gameIds seen recently
}

export interface ContentSignals {
  clipId: string;
  creatorId: string;
  gameId: string;
  language?: string;
  createdAt: Date;
  // Engagement signals (Master Prompt Section 11)
  watchTimeRatio: number; // wt: 0-1, average watch time / duration
  completion: number; // comp: 0-1, completion rate
  earlySwipe: number; // es: 0-1, 1 if swiped in first N seconds (negative signal)
  likes: number; // L
  dislikes: number; // D
  shares: number; // S
  comments: number; // C
  saves: number; // Sv (saves/bookmarks)
  rewatchCount: number; // RE: replay/editing events
  // Creator signals
  creatorQualityScore?: number; // CQ: 0-1, from moderation
  creatorTrustScore?: number; // 0-1, from moderation
  moderationRisk: number; // MR: 0 = safe, 1 = borderline, 2 = bad (Master Prompt Section 11)
  // Context signals
  followedCreator: boolean; // 0-1, boolean
  sameGamePreferenceScore: number; // G: 0-1, based on user's game preferences
  freshnessBoost: number; // F: 0-1, exponential decay with age
  localeMatch: number; // 0-1, 1 if language matches user locale
  sessionContext: number; // 0-1, boost if user just played same game
  premiumUserBoost: number; // P: 0-1, boost for premium users
  // Penalties
  repetitionPenalty: number; // 0-1, penalty for showing same creator/game too often
  diversityPenalty: number; // DV: 0-1, penalty for lack of diversity
}

export interface ScoringWeights {
  w1: number; // watchTimeRatio
  w2: number; // completion
  w3: number; // like
  w4: number; // dislike
  w5: number; // share
  w6: number; // comment
  w7: number; // followedCreator
  w8: number; // sameGamePreferenceScore
  w9: number; // freshnessBoost
  w10: number; // localeBoost
  w11: number; // premiumUserBoost
  w12: number; // creatorQualityScore
  w13: number; // repetitionPenalty
  w14: number; // diversityPenalty
}

// Default weights (tuned experimentally, can be adjusted)
// Master Prompt Section 11: "The exact weights w1…wN must be configurable and stored in a config, not hard‑coded"
export const DEFAULT_WEIGHTS: ScoringWeights = {
  w1: 0.15, // watchTimeRatio (wt) - high weight, strong engagement signal
  w2: 0.20, // completion (comp) - very high weight, completion is key
  w3: 0.10, // like (L) - positive signal
  w4: 0.15, // dislike (D) - negative signal (subtracted)
  w5: 0.12, // share (S) - strong signal
  w6: 0.08, // comment (C) - engagement signal
  w7: 0.10, // followedCreator - social signal
  w8: 0.08, // sameGamePreferenceScore (G) - personalization
  w9: 0.05, // freshnessBoost (F) - recency
  w10: 0.05, // localeBoost - localization
  w11: 0.02, // premiumUserBoost (P) - small boost for premium
  w12: 0.10, // creatorQualityScore (CQ) - quality signal
  w13: 0.10, // repetitionPenalty - avoid repetition
  w14: 0.10, // diversityPenalty (DV) - ensure diversity
  // Additional weights for Master Prompt signals
  w15: 0.08, // earlySwipe (es) - negative weight (subtracted)
  w16: 0.10, // saves (Sv) - strong signal
  w17: 0.05, // rewatchCount (RE) - replay/editing events boost
  w18: 0.20, // moderationRisk (MR) - negative weight (subtracted), high penalty for unsafe content
};

/**
 * Calculate freshness boost (exponential decay)
 * 
 * freshnessBoost = exp(-lambda * ageHours)
 * where lambda controls decay rate
 */
export function calculateFreshnessBoost(ageHours: number, lambda: number = 0.1): number {
  return Math.exp(-lambda * ageHours);
}

/**
 * Calculate repetition penalty
 * 
 * Penalty increases if content from same creator/game appears too often
 */
export function calculateRepetitionPenalty(
  creatorId: string,
  gameId: string,
  recentCreators: string[],
  recentGames: string[],
  windowSize: number = 10
): number {
  const recentWindow = recentCreators.slice(-windowSize);
  const recentGamesWindow = recentGames.slice(-windowSize);

  const creatorCount = recentWindow.filter((id) => id === creatorId).length;
  const gameCount = recentGamesWindow.filter((id) => id === gameId).length;

  // Penalty increases with frequency (0 = no penalty, 1 = max penalty)
  const creatorPenalty = Math.min(creatorCount / windowSize, 1.0);
  const gamePenalty = Math.min(gameCount / windowSize, 1.0);

  return (creatorPenalty + gamePenalty) / 2;
}

/**
 * Calculate diversity penalty
 * 
 * Penalty for lack of diversity across games and creators
 */
export function calculateDiversityPenalty(
  recentCreators: string[],
  recentGames: string[],
  currentCreatorId: string,
  currentGameId: string,
  windowSize: number = 20
): number {
  const recentWindow = recentCreators.slice(-windowSize);
  const recentGamesWindow = recentGames.slice(-windowSize);

  // Count unique creators and games
  const uniqueCreators = new Set(recentWindow).size;
  const uniqueGames = new Set(recentGamesWindow).size;

  // If we already have this creator/game, add penalty
  const hasCreator = recentWindow.includes(currentCreatorId);
  const hasGame = recentGamesWindow.includes(currentGameId);

  // Penalty based on lack of diversity
  const diversityScore = (uniqueCreators + uniqueGames) / (windowSize * 2);
  const penalty = 1.0 - diversityScore; // Lower diversity = higher penalty

  // Additional penalty if exact match
  if (hasCreator && hasGame) {
    return Math.min(penalty + 0.3, 1.0);
  }

  return penalty;
}

/**
 * Calculate same game preference score
 * 
 * Based on user's historical game preferences
 */
export function calculateSameGamePreferenceScore(
  gameId: string,
  gamePreferences: Record<string, number>
): number {
  return gamePreferences[gameId] || 0.0;
}

/**
 * Calculate locale match score
 */
export function calculateLocaleMatch(
  contentLanguage: string | undefined,
  userLocale: string
): number {
  if (!contentLanguage) return 0.5; // Neutral if unknown
  if (contentLanguage === userLocale) return 1.0;
  // Partial match (e.g., en-US vs en)
  if (contentLanguage.startsWith(userLocale) || userLocale.startsWith(contentLanguage)) {
    return 0.7;
  }
  return 0.3; // Different language
}

/**
 * Gather all signals for a content item
 */
export function gatherContentSignals(
  clip: ClipDTO,
  userSignals: UserSignals,
  sessionContext?: { gameId?: string }
): ContentSignals {
  const now = new Date();
  const createdAt = new Date(clip.createdAt);
  const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // Calculate freshness boost
  const freshnessBoost = calculateFreshnessBoost(ageHours);

  // Calculate repetition penalty
  const repetitionPenalty = calculateRepetitionPenalty(
    clip.creatorId,
    clip.gameId,
    userSignals.recentCreators,
    userSignals.recentGames
  );

  // Calculate diversity penalty
  const diversityPenalty = calculateDiversityPenalty(
    userSignals.recentCreators,
    userSignals.recentGames,
    clip.creatorId,
    clip.gameId
  );

  // Calculate same game preference score
  const sameGamePreferenceScore = calculateSameGamePreferenceScore(
    clip.gameId,
    userSignals.gamePreferences
  );

  // Calculate locale match
  const localeMatch = calculateLocaleMatch(clip.language, userSignals.locale);

  // Session context boost (if user just played same game)
  const sessionContextBoost =
    sessionContext?.gameId === clip.gameId ? 0.3 : 0.0;

  // Premium user boost
  const premiumUserBoost = userSignals.isPremium ? 0.2 : 0.0;

  // Followed creator
  const followedCreator = userSignals.followedCreators.includes(clip.creatorId);

  // Engagement signals (normalized)
  // TODO: Get actual watchTimeRatio and completion from analytics service
  const totalEngagement = clip.views || 1;
  const watchTimeRatio = Math.min((clip.views * 0.5) / totalEngagement, 1.0); // Simplified
  const completion = Math.min((clip.views * 0.3) / totalEngagement, 1.0); // Simplified
  
  // Early swipe signal (Master Prompt Section 11: "early swipe (es): 1 if swiped in first N seconds")
  // This is a negative signal - if user swipes away quickly, content is less relevant
  // TODO: Get from analytics service (track early swipes)
  const earlySwipe = 0.0; // Default: no early swipe (will be set by analytics if available)
  
  // Saves signal (Master Prompt Section 11: "saves (Sv)")
  // TODO: Track saves/bookmarks from analytics
  const saves = 0; // Default: no saves tracked yet
  
  // Rewatch count (Master Prompt Section 11: "replay/editing events (RE)")
  // TODO: Track rewatch count from analytics
  const rewatchCount = 0; // Default: no rewatches tracked yet
  
  // Moderation risk (Master Prompt Section 11: "moderation risk (MR): 0 = safe, 1 = borderline, 2 = bad")
  // Will be set by caller with moderation scores
  const moderationRisk = 0.0; // Default: safe (0)

  return {
    clipId: clip.id,
    creatorId: clip.creatorId,
    gameId: clip.gameId,
    language: clip.language,
    createdAt,
    watchTimeRatio,
    completion,
    earlySwipe,
    likes: clip.likes,
    dislikes: 0, // TODO: Track dislikes
    shares: clip.shares,
    comments: clip.comments,
    saves, // Master Prompt: saves (Sv)
    rewatchCount, // Master Prompt: replay/editing events (RE)
    creatorQualityScore: 0.8, // Will be set by caller with moderation scores
    creatorTrustScore: 0.8, // Will be set by caller with moderation scores
    moderationRisk, // Master Prompt: moderation risk (MR)
    followedCreator,
    sameGamePreferenceScore,
    freshnessBoost,
    localeMatch,
    sessionContext: sessionContextBoost,
    premiumUserBoost,
    repetitionPenalty,
    diversityPenalty,
  };
}

/**
 * Calculate recommendation score for content
 */
export function calculateScore(
  signals: ContentSignals,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  // Normalize engagement signals
  const normalizedLikes = Math.min(signals.likes / 1000, 1.0); // Cap at 1000 likes
  const normalizedDislikes = Math.min(signals.dislikes / 100, 1.0); // Cap at 100 dislikes
  const normalizedShares = Math.min(signals.shares / 100, 1.0); // Cap at 100 shares
  const normalizedComments = Math.min(signals.comments / 500, 1.0); // Cap at 500 comments
  const normalizedRewatch = Math.min(signals.rewatchCount / 10, 1.0); // Cap at 10 rewatches

  // Calculate score (Master Prompt Section 11 formula)
  let score = 0;

  // Base score (w1-w6)
  score += weights.w1 * signals.watchTimeRatio; // wt
  score += weights.w2 * signals.completion; // comp
  score += weights.w3 * normalizedLikes; // L
  score -= weights.w4 * normalizedDislikes; // D (subtracted)
  score += weights.w5 * normalizedShares; // S
  score += weights.w6 * normalizedComments; // C

  // Additional engagement signals (Master Prompt Section 11)
  const normalizedSaves = Math.min(signals.saves / 50, 1.0); // Cap at 50 saves
  if (weights.w16) {
    score += weights.w16 * normalizedSaves; // Sv (saves)
  }

  // Early swipe penalty (Master Prompt Section 11: "early swipe (es): 1 if swiped in first N seconds")
  if (weights.w15) {
    score -= weights.w15 * signals.earlySwipe; // es (subtracted, negative signal)
  }

  // Rewatch bonus (Master Prompt Section 11: "replay/editing events (RE)")
  if (weights.w17 && signals.rewatchCount > 0) {
    score += weights.w17 * normalizedRewatch; // RE
  } else if (signals.rewatchCount > 0) {
    // Fallback if w17 not defined
    score += 0.05 * normalizedRewatch;
  }

  // Adjustments (w7-w12)
  score += weights.w7 * (signals.followedCreator ? 1.0 : 0.0);
  score += weights.w8 * signals.sameGamePreferenceScore; // G
  score += weights.w9 * signals.freshnessBoost; // F
  score += weights.w10 * signals.localeMatch;
  score += weights.w11 * signals.premiumUserBoost; // P
  score += weights.w12 * (signals.creatorQualityScore || 0.5); // CQ

  // Penalties (w13-w14, w18)
  score -= weights.w13 * signals.repetitionPenalty;
  score -= weights.w14 * signals.diversityPenalty; // DV

  // Moderation risk penalty (Master Prompt Section 11: "apply big negative penalty if MR > 0")
  if (weights.w18) {
    // MR: 0 = safe, 1 = borderline, 2 = bad
    // Apply big negative penalty for unsafe content
    const mrPenalty = signals.moderationRisk === 0 ? 0 : 
                      signals.moderationRisk === 1 ? weights.w18 * 0.5 : 
                      weights.w18 * 1.0; // Full penalty for bad content
    score -= mrPenalty;
  } else if (signals.moderationRisk > 0) {
    // Fallback if w18 not defined
    score -= 0.2 * signals.moderationRisk; // Penalty for unsafe content
  }

  // Add session context boost
  score += signals.sessionContext * 0.1;

  // Ensure score is non-negative
  return Math.max(score, 0);
}


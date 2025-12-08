/**
 * Scoring Engine Tests
 */

// @ts-nocheck - Test file, type checking disabled
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { describe, it, expect } from '@jest/globals';
import {
  calculateScore,
  calculateFreshnessBoost,
  calculateRepetitionPenalty,
  calculateDiversityPenalty,
  gatherContentSignals,
  DEFAULT_WEIGHTS,
} from '../src/scoring-engine';
import type { ClipDTO } from '@strike/shared-types';

describe('Scoring Engine', () => {
  describe('calculateFreshnessBoost', () => {
    it('should return 1.0 for very recent content', () => {
      const boost = calculateFreshnessBoost(0.1); // 0.1 hours old
      expect(boost).toBeCloseTo(1.0, 1);
    });

    it('should decay exponentially with age', () => {
      const boost1 = calculateFreshnessBoost(1); // 1 hour old
      const boost24 = calculateFreshnessBoost(24); // 24 hours old
      expect(boost24).toBeLessThan(boost1);
    });
  });

  describe('calculateRepetitionPenalty', () => {
    it('should return 0 for no repetition', () => {
      const penalty = calculateRepetitionPenalty(
        'creator_1',
        'game_1',
        [],
        []
      );
      expect(penalty).toBe(0);
    });

    it('should increase penalty with frequency', () => {
      const recentCreators = ['creator_1', 'creator_1', 'creator_1'];
      const recentGames = ['game_1', 'game_1'];
      const penalty = calculateRepetitionPenalty(
        'creator_1',
        'game_1',
        recentCreators,
        recentGames
      );
      expect(penalty).toBeGreaterThan(0);
    });
  });

  describe('calculateDiversityPenalty', () => {
    it('should return low penalty for diverse content', () => {
      const recentCreators = ['creator_1', 'creator_2', 'creator_3'];
      const recentGames = ['game_1', 'game_2', 'game_3'];
      const penalty = calculateDiversityPenalty(
        recentCreators,
        recentGames,
        'creator_4',
        'game_4'
      );
      expect(penalty).toBeLessThan(0.5);
    });

    it('should return high penalty for repetitive content', () => {
      const recentCreators = ['creator_1', 'creator_1', 'creator_1'];
      const recentGames = ['game_1', 'game_1', 'game_1'];
      const penalty = calculateDiversityPenalty(
        recentCreators,
        recentGames,
        'creator_1',
        'game_1'
      );
      expect(penalty).toBeGreaterThan(0.5);
    });
  });

  describe('calculateScore', () => {
    it('should calculate score with all signals', () => {
      const signals = {
        clipId: 'clip_1',
        creatorId: 'creator_1',
        gameId: 'game_1',
        createdAt: new Date(),
        watchTimeRatio: 0.8,
        completion: 0.9,
        likes: 100,
        dislikes: 5,
        shares: 20,
        comments: 50,
        rewatchCount: 5,
        creatorQualityScore: 0.9,
        creatorTrustScore: 0.9,
        followedCreator: true,
        sameGamePreferenceScore: 0.8,
        freshnessBoost: 0.9,
        localeMatch: 1.0,
        sessionContext: 0.3,
        premiumUserBoost: 0.2,
        repetitionPenalty: 0.1,
        diversityPenalty: 0.1,
      };

      const score = calculateScore(signals, DEFAULT_WEIGHTS);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10); // Reasonable upper bound
    });

    it('should return non-negative score', () => {
      const signals = {
        clipId: 'clip_1',
        creatorId: 'creator_1',
        gameId: 'game_1',
        createdAt: new Date(),
        watchTimeRatio: 0.0,
        completion: 0.0,
        likes: 0,
        dislikes: 100,
        shares: 0,
        comments: 0,
        rewatchCount: 0,
        creatorQualityScore: 0.0,
        creatorTrustScore: 0.0,
        followedCreator: false,
        sameGamePreferenceScore: 0.0,
        freshnessBoost: 0.0,
        localeMatch: 0.0,
        sessionContext: 0.0,
        premiumUserBoost: 0.0,
        repetitionPenalty: 1.0,
        diversityPenalty: 1.0,
      };

      const score = calculateScore(signals, DEFAULT_WEIGHTS);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});


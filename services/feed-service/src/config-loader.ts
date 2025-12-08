/**
 * Configuration Loader for Recommendation Engine
 * 
 * Loads recommendation weights from database (configurable per Master Prompt requirement)
 * Falls back to DEFAULT_WEIGHTS if no active config found
 */

import { prisma } from '@strike/shared-db';
import type { ScoringWeights } from './scoring-engine';
import { DEFAULT_WEIGHTS } from './scoring-engine';

/**
 * Load active recommendation weights from database
 * 
 * @returns ScoringWeights - Active config or DEFAULT_WEIGHTS
 */
/**
 * Load active recommendation weights from database
 * 
 * Master Prompt Section 11: "The exact weights w1…wN must be configurable and stored in a config, not hard‑coded"
 * 
 * @returns ScoringWeights - Active config or DEFAULT_WEIGHTS
 */
export async function loadRecommendationWeights(): Promise<ScoringWeights> {
  try {
    const activeConfig = await prisma.recommendationConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (activeConfig && activeConfig.weights) {
      const weights = activeConfig.weights as ScoringWeights;
      
      // Validate weights structure
      if (
        typeof weights.w1 === 'number' &&
        typeof weights.w2 === 'number' &&
        typeof weights.w3 === 'number' &&
        typeof weights.w4 === 'number' &&
        typeof weights.w5 === 'number' &&
        typeof weights.w6 === 'number' &&
        typeof weights.w7 === 'number' &&
        typeof weights.w8 === 'number' &&
        typeof weights.w9 === 'number' &&
        typeof weights.w10 === 'number' &&
        typeof weights.w11 === 'number' &&
        typeof weights.w12 === 'number' &&
        typeof weights.w13 === 'number' &&
        typeof weights.w14 === 'number'
      ) {
        console.log(`[CONFIG] Loaded recommendation weights from config: ${activeConfig.name}`);
        return weights;
      } else {
        console.warn(`[CONFIG] Invalid weights structure in config ${activeConfig.name}, using defaults`);
      }
    }
  } catch (error) {
    console.error('[CONFIG] Error loading recommendation weights:', error);
  }

  // Fallback to defaults
  console.log('[CONFIG] Using default recommendation weights');
  return DEFAULT_WEIGHTS;
}

/**
 * Initialize default recommendation config in database
 * 
 * This should be called once during service startup or migration
 */
export async function initializeDefaultConfig(): Promise<void> {
  try {
    const existing = await prisma.recommendationConfig.findUnique({
      where: { name: 'default' },
    });

    if (!existing) {
      await prisma.recommendationConfig.create({
        data: {
          name: 'default',
          description: 'Default recommendation weights (tuned experimentally)',
          weights: DEFAULT_WEIGHTS,
          isActive: true,
        },
      });
      console.log('[CONFIG] Created default recommendation config');
    } else if (!existing.isActive) {
      // Activate default if no other config is active
      const hasActive = await prisma.recommendationConfig.findFirst({
        where: { isActive: true },
      });
      
      if (!hasActive) {
        await prisma.recommendationConfig.update({
          where: { name: 'default' },
          data: { isActive: true },
        });
        console.log('[CONFIG] Activated default recommendation config');
      }
    }
  } catch (error) {
    console.error('[CONFIG] Error initializing default config:', error);
  }
}

/**
 * Update recommendation weights
 * 
 * @param name - Config name
 * @param weights - New weights
 * @param setActive - Whether to set this config as active
 */
export async function updateRecommendationWeights(
  name: string,
  weights: ScoringWeights,
  setActive: boolean = false
): Promise<void> {
  await prisma.recommendationConfig.upsert({
    where: { name },
    create: {
      name,
      description: `Recommendation weights config: ${name}`,
      weights,
      isActive: setActive,
    },
    update: {
      weights,
      isActive: setActive,
      updatedAt: new Date(),
    },
  });

  // If setting active, deactivate all others
  if (setActive) {
    await prisma.recommendationConfig.updateMany({
      where: {
        isActive: true,
        NOT: { name },
      },
      data: { isActive: false },
    });
  }

  console.log(`[CONFIG] Updated recommendation weights config: ${name} (active: ${setActive})`);
}


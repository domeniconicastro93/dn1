/**
 * User Signals Manager
 * 
 * Manages user interaction signals for recommendation engine.
 * Uses Redis for fast access with in-memory fallback.
 */

export interface UserInteraction {
  clipId: string;
  creatorId: string;
  gameId: string;
  action: 'view' | 'like' | 'dislike' | 'share' | 'comment' | 'rewatch';
  watchTime?: number; // seconds
  completion?: number; // 0-1
  timestamp: Date;
}

// In-memory store (fallback if Redis not available)
class UserSignalsStore {
  private interactions: Map<string, UserInteraction[]> = new Map();
  private gamePreferences: Map<string, Record<string, number>> = new Map();
  private followedCreators: Map<string, string[]> = new Map();

  addInteraction(userId: string, interaction: UserInteraction): void {
    if (!this.interactions.has(userId)) {
      this.interactions.set(userId, []);
    }
    this.interactions.get(userId)!.push(interaction);

    // Keep only last 1000 interactions per user
    const userInteractions = this.interactions.get(userId)!;
    if (userInteractions.length > 1000) {
      userInteractions.shift();
    }
  }

  getInteractions(userId: string, limit: number = 100): UserInteraction[] {
    const interactions = this.interactions.get(userId) || [];
    return interactions.slice(-limit);
  }

  updateGamePreference(userId: string, gameId: string, score: number): void {
    if (!this.gamePreferences.has(userId)) {
      this.gamePreferences.set(userId, {});
    }
    const preferences = this.gamePreferences.get(userId)!;
    preferences[gameId] = score;
  }

  getGamePreferences(userId: string): Record<string, number> {
    return this.gamePreferences.get(userId) || {};
  }

  setFollowedCreators(userId: string, creatorIds: string[]): void {
    this.followedCreators.set(userId, creatorIds);
  }

  getFollowedCreators(userId: string): string[] {
    return this.followedCreators.get(userId) || [];
  }

  // Build user signals from interactions
  buildUserSignals(
    userId: string,
    locale: string,
    isPremium: boolean = false
  ): import('./scoring-engine').UserSignals {
    const interactions = this.getInteractions(userId, 100);
    const recentWatches = interactions
      .filter((i) => i.action === 'view')
      .map((i) => i.clipId)
      .slice(-20);
    const recentCreators = interactions
      .map((i) => i.creatorId)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .slice(-20);
    const recentGames = interactions
      .map((i) => i.gameId)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .slice(-20);

    // Calculate game preferences from interactions
    const gameScores: Record<string, number> = {};
    for (const interaction of interactions) {
      if (!gameScores[interaction.gameId]) {
        gameScores[interaction.gameId] = 0;
      }
      // Weight different actions
      const weight =
        interaction.action === 'like' ? 1.0 :
        interaction.action === 'share' ? 0.8 :
        interaction.action === 'comment' ? 0.6 :
        interaction.action === 'view' ? 0.2 : 0.1;
      gameScores[interaction.gameId] += weight;
    }

    // Normalize game preferences to 0-1
    const maxScore = Math.max(...Object.values(gameScores), 1);
    for (const gameId in gameScores) {
      gameScores[gameId] = gameScores[gameId] / maxScore;
    }

    return {
      userId,
      locale,
      isPremium,
      followedCreators: this.getFollowedCreators(userId),
      gamePreferences: gameScores,
      recentWatches,
      recentCreators,
      recentGames,
    };
  }
}

  // Build user signals from database
  async buildUserSignalsFromDB(
    userId: string,
    locale: string,
    isPremium: boolean = false
  ): Promise<import('./scoring-engine').UserSignals> {
    // Check Redis cache first
    const { getCachedUserSignals, cacheUserSignals } = await import('./redis-ranking');
    const cached = await getCachedUserSignals(userId);
    if (cached) {
      return cached as import('./scoring-engine').UserSignals;
    }

    // Import prisma dynamically to avoid circular dependency
    const { prisma } = await import('@strike/shared-db');

    // Get user's premium status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premiumTier: true, premiumExpiresAt: true },
    });
    const isUserPremium = !!(
      user?.premiumTier &&
      user?.premiumExpiresAt &&
      user.premiumExpiresAt > new Date()
    );

    // Get followed creators
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedCreators = follows.map((f) => f.followingId);

    // Get recent analytics events for user signals
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventType: { in: ['ClipViewed', 'ReplaySaved', 'ReelPublished'] },
      },
      take: 100,
      orderBy: { timestamp: 'desc' },
    });

    const recentWatches = recentEvents
      .filter((e) => e.eventType === 'ClipViewed')
      .map((e) => (e.metadata as any)?.clipId)
      .filter(Boolean)
      .slice(-20);

    const recentCreators = recentEvents
      .map((e) => (e.metadata as any)?.creatorId)
      .filter(Boolean)
      .filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index)
      .slice(-20);

    const recentGames = recentEvents
      .map((e) => (e.metadata as any)?.gameId)
      .filter(Boolean)
      .filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index)
      .slice(-20);

    // Calculate game preferences from events
    const gameScores: Record<string, number> = {};
    for (const event of recentEvents) {
      const gameId = (event.metadata as any)?.gameId;
      if (!gameId) continue;

      if (!gameScores[gameId]) {
        gameScores[gameId] = 0;
      }

      const weight =
        event.eventType === 'ReelPublished' ? 1.0 :
        event.eventType === 'ReplaySaved' ? 0.8 :
        event.eventType === 'ClipViewed' ? 0.2 : 0.1;
      gameScores[gameId] += weight;
    }

    // Normalize game preferences to 0-1
    const maxScore = Math.max(...Object.values(gameScores), 1);
    for (const gameId in gameScores) {
      gameScores[gameId] = gameScores[gameId] / maxScore;
    }

    const userSignals = {
      userId,
      locale,
      isPremium: isUserPremium || isPremium,
      followedCreators,
      gamePreferences: gameScores,
      recentWatches,
      recentCreators,
      recentGames,
    };

    // Cache in Redis
    await cacheUserSignals(userId, userSignals);

    return userSignals;
  }
}

export const userSignalsStore = new UserSignalsStore();

/**
 * Record user interaction
 * 
 * Called by analytics service when user interacts with content
 */
export function recordInteraction(
  userId: string,
  clipId: string,
  creatorId: string,
  gameId: string,
  action: UserInteraction['action'],
  watchTime?: number,
  completion?: number
): void {
  userSignalsStore.addInteraction(userId, {
    clipId,
    creatorId,
    gameId,
    action,
    watchTime,
    completion,
    timestamp: new Date(),
  });

  // Update game preference based on interaction
  if (action === 'like' || action === 'share') {
    const currentPref = userSignalsStore.getGamePreferences(userId)[gameId] || 0;
    userSignalsStore.updateGamePreference(userId, gameId, Math.min(currentPref + 0.1, 1.0));
  }
}


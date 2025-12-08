/**
 * F2P Ownership Detection Module
 * 
 * Steam's GetOwnedGames API does NOT return most F2P games.
 * This module implements a multi-signal detection system to determine
 * if a user has actually played a F2P game.
 * 
 * Detection Signals:
 * 1. Recently Played (last 2 weeks)
 * 2. Has Achievements (unlocked at least one)
 * 3. Has Stats (has gameplay statistics)
 */

import fetch from 'node-fetch';
import { STEAM_API_KEY } from './env';

export type F2POwnershipReason = 'recently_played' | 'achievements' | 'stats';

export interface F2PDetectionResult {
    appId: number;
    owned: boolean;
    reason?: F2POwnershipReason;
}

interface RecentlyPlayedGame {
    appid: number;
    name: string;
    playtime_2weeks: number;
    playtime_forever: number;
}

/**
 * Fetch recently played games (last 2 weeks)
 * Endpoint: IPlayerService/GetRecentlyPlayedGames/v1
 */
async function getRecentlyPlayedGames(steamId64: string): Promise<number[]> {
    const DEBUG = process.env.DEBUG_STEAM === 'true';

    try {
        const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&format=json`;

        if (DEBUG) {
            console.log('[F2P Detection] Fetching recently played games...');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn('[F2P Detection] Recently played API failed:', response.status);
            return [];
        }

        const data = await response.json();
        const games: RecentlyPlayedGame[] = data?.response?.games || [];

        const appIds = games.map(g => g.appid);

        if (DEBUG) {
            console.log('[F2P Detection] Recently played AppIDs:', appIds);
        }

        return appIds;
    } catch (error: any) {
        console.error('[F2P Detection] Error fetching recently played:', error.message);
        return [];
    }
}

/**
 * Check if user has achievements for a specific game
 * Endpoint: ISteamUserStats/GetPlayerAchievements/v1
 */
async function hasAchievements(steamId64: string, appId: number): Promise<boolean> {
    try {
        const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&appid=${appId}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        const achievements = data?.playerstats?.achievements || [];

        // If user has unlocked at least one achievement, they've played the game
        const hasUnlocked = achievements.some((a: any) => a.achieved === 1);

        return hasUnlocked;
    } catch (error: any) {
        // Silently fail - this is a best-effort check
        return false;
    }
}

/**
 * Check if user has stats for a specific game
 * Endpoint: ISteamUserStats/GetUserStatsForGame/v1
 */
async function hasStats(steamId64: string, appId: number): Promise<boolean> {
    try {
        const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&appid=${appId}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        const stats = data?.playerstats?.stats || [];

        // If user has any stats, they've played the game
        return stats.length > 0;
    } catch (error: any) {
        // Silently fail - this is a best-effort check
        return false;
    }
}

/**
 * Detect F2P ownership for a list of AppIDs
 * 
 * This function checks multiple signals in parallel to determine
 * if the user has played F2P games that don't appear in GetOwnedGames.
 * 
 * @param steamId64 - User's Steam ID
 * @param f2pAppIds - List of F2P game AppIDs to check
 * @returns Map of AppID -> Detection Result
 */
export async function detectF2POwnership(
    steamId64: string,
    f2pAppIds: number[]
): Promise<Map<number, F2PDetectionResult>> {
    const DEBUG = process.env.DEBUG_STEAM === 'true';
    const results = new Map<number, F2PDetectionResult>();

    if (f2pAppIds.length === 0) {
        return results;
    }

    if (DEBUG) {
        console.log('[F2P Detection] === START F2P DETECTION ===');
        console.log('[F2P Detection] Checking', f2pAppIds.length, 'F2P games');
        console.log('[F2P Detection] AppIDs:', f2pAppIds);
    }

    try {
        // STEP 1: Get recently played games (fast, single API call)
        const recentlyPlayedIds = await getRecentlyPlayedGames(steamId64);

        // Mark recently played games as owned
        for (const appId of f2pAppIds) {
            if (recentlyPlayedIds.includes(appId)) {
                results.set(appId, {
                    appId,
                    owned: true,
                    reason: 'recently_played'
                });
            }
        }

        if (DEBUG) {
            console.log('[F2P Detection] Recently played matches:', results.size);
        }

        // STEP 2: For remaining F2P games, check achievements & stats in parallel
        const remainingAppIds = f2pAppIds.filter(id => !results.has(id));

        if (remainingAppIds.length === 0) {
            if (DEBUG) {
                console.log('[F2P Detection] All F2P games found in recently played');
                console.log('[F2P Detection] === END F2P DETECTION ===');
            }
            return results;
        }

        if (DEBUG) {
            console.log('[F2P Detection] Checking achievements/stats for', remainingAppIds.length, 'games');
        }

        // Check achievements and stats in parallel (with concurrency limit)
        const BATCH_SIZE = 5; // Check 5 games at a time to avoid rate limits

        for (let i = 0; i < remainingAppIds.length; i += BATCH_SIZE) {
            const batch = remainingAppIds.slice(i, i + BATCH_SIZE);

            const promises = batch.flatMap(appId => [
                hasAchievements(steamId64, appId).then(result => ({ appId, type: 'achievements' as const, result })),
                hasStats(steamId64, appId).then(result => ({ appId, type: 'stats' as const, result }))
            ]);

            const batchResults = await Promise.allSettled(promises);

            // Process results
            for (const promiseResult of batchResults) {
                if (promiseResult.status === 'fulfilled') {
                    const { appId, type, result } = promiseResult.value;

                    if (result && !results.has(appId)) {
                        results.set(appId, {
                            appId,
                            owned: true,
                            reason: type
                        });
                    }
                }
            }
        }

        if (DEBUG) {
            console.log('[F2P Detection] Final F2P owned count:', results.size);
            console.log('[F2P Detection] Breakdown:');
            const breakdown = {
                recently_played: 0,
                achievements: 0,
                stats: 0
            };
            results.forEach(r => {
                if (r.reason) breakdown[r.reason]++;
            });
            console.log('[F2P Detection]   - Recently played:', breakdown.recently_played);
            console.log('[F2P Detection]   - Achievements:', breakdown.achievements);
            console.log('[F2P Detection]   - Stats:', breakdown.stats);
            console.log('[F2P Detection] === END F2P DETECTION ===');
        }

        return results;
    } catch (error: any) {
        console.error('[F2P Detection] Error during F2P detection:', error.message);
        return results; // Return partial results
    }
}

/**
 * List of known F2P games on Steam
 * This list should be maintained and updated periodically
 */
export const KNOWN_F2P_GAMES = [
    730,      // Counter-Strike 2
    570,      // Dota 2
    440,      // Team Fortress 2
    1172470,  // Apex Legends
    1938090,  // Call of Duty: Warzone
    578080,   // PUBG (now F2P)
    1172620,  // Sea of Thieves
    1599340,  // Overwatch 2
    2357570,  // Halo Infinite
    1966720,  // Destiny 2
    252490,   // Rust (has F2P weekends)
    // Add more as needed
];

/**
 * Check if an AppID is a known F2P game
 */
export function isKnownF2PGame(appId: number): boolean {
    return KNOWN_F2P_GAMES.includes(appId);
}

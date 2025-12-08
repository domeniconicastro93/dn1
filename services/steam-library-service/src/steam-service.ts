import { prisma } from '@strike/shared-db';
import { cache } from '@strike/shared-utils';
import { getOwnedGames, LibraryResult, OwnedGame } from './steam-web-api';
import { detectF2POwnership, KNOWN_F2P_GAMES } from './f2p-detection';
import { fetchCommunityLibraryAppIds } from './community-library';

const CACHE_TTL_MS = 10 * 1000; // 10 seconds cache for faster testing
const COMMUNITY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for community library

export class SteamService {
    async getOwnedGamesForUser(userId: string): Promise<LibraryResult> {
        // 1. Get Steam ID for user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { steamId64: true },
        });

        if (!user || !user.steamId64) {
            console.log(`[SteamService] User ${userId} has no Steam ID linked.`);
            return { games: [], privacyState: 'unknown', error: 'STEAM_NOT_LINKED' };
        }

        const steamId = user.steamId64;
        const cacheKey = `steam:ownedGames:${steamId}`;

        // 2. Check Cache
        const cached = cache.get<LibraryResult>(cacheKey);
        if (cached) {
            console.log(`[SteamService] Cache HIT for ${steamId}`);
            return cached;
        }

        console.log(`[SteamService] Cache MISS for ${steamId}. Fetching live...`);

        // 3. Fetch Live (Phase 2 - GetOwnedGames)
        try {
            const result = await getOwnedGames(steamId);

            // PHASE 2.5: F2P ENRICHMENT
            // If privacy is private, skip F2P detection (Phase 2 override)
            if (result.privacyState === 'private' || result.privacyState === 'unknown') {
                console.log('[SteamService] Privacy is not public - skipping F2P detection');

                // Store in cache and return
                if (result.privacyState !== 'unknown') {
                    cache.set(cacheKey, result, CACHE_TTL_MS);
                }
                return result;
            }

            // Privacy is PUBLIC - proceed with F2P enrichment
            console.log('[SteamService] === PHASE 2.5: F2P ENRICHMENT ===');

            // Get AppIDs already owned from Phase 2
            const ownedAppIds = new Set(result.games.map(g => g.appid));

            // Find F2P games that are NOT in owned list
            const missingF2PGames = KNOWN_F2P_GAMES.filter(appId => !ownedAppIds.has(appId));

            if (missingF2PGames.length === 0) {
                console.log('[SteamService] No missing F2P games to check');
            } else {
                console.log('[SteamService] Checking', missingF2PGames.length, 'missing F2P games:', missingF2PGames);

                // Detect F2P ownership
                const f2pResults = await detectF2POwnership(steamId, missingF2PGames);

                // Add detected F2P games to the result
                const f2pGames: OwnedGame[] = [];
                f2pResults.forEach((detection, appId) => {
                    if (detection.owned) {
                        f2pGames.push({
                            appid: appId,
                            name: `F2P Game ${appId}`, // Name will be enriched by frontend from catalog
                            playtime_forever: 0,
                            img_icon_url: '',
                            img_logo_url: '',
                        });
                        console.log(`[SteamService] ✅ F2P game ${appId} detected as owned (reason: ${detection.reason})`);
                        ownedAppIds.add(appId); // Add to owned set for Phase 2.6
                    }
                });

                if (f2pGames.length > 0) {
                    console.log('[SteamService] Adding', f2pGames.length, 'F2P games to owned list');
                    result.games = [...result.games, ...f2pGames];
                }
            }

            console.log('[SteamService] === END F2P ENRICHMENT ===');

            // PHASE 2.6: COMMUNITY LIBRARY FALLBACK
            console.log('[SteamService] === PHASE 2.6: COMMUNITY LIBRARY FALLBACK ===');

            // Check community library cache first
            const communityCacheKey = `steam:communityLibrary:${steamId}`;
            let communityAppIds = cache.get<Set<number>>(communityCacheKey);

            if (!communityAppIds) {
                console.log('[SteamService] Community library cache MISS - fetching HTML...');
                communityAppIds = await fetchCommunityLibraryAppIds(steamId);

                // Cache community library results (longer TTL since HTML changes rarely)
                if (communityAppIds.size > 0) {
                    cache.set(communityCacheKey, communityAppIds, COMMUNITY_CACHE_TTL_MS);
                    console.log('[SteamService] Cached', communityAppIds.size, 'community library AppIDs');
                }
            } else {
                console.log('[SteamService] Community library cache HIT -', communityAppIds.size, 'AppIDs');
            }

            // Find games in community library but not in owned list
            const communityOnlyGames: OwnedGame[] = [];
            communityAppIds.forEach(appId => {
                if (!ownedAppIds.has(appId)) {
                    communityOnlyGames.push({
                        appid: appId,
                        name: `Community Game ${appId}`, // Name will be enriched by frontend from catalog
                        playtime_forever: 0,
                        img_icon_url: '',
                        img_logo_url: '',
                    });
                    console.log(`[SteamService] ✅ Game ${appId} found in community library (fallback)`);
                }
            });

            if (communityOnlyGames.length > 0) {
                console.log('[SteamService] Adding', communityOnlyGames.length, 'games from community library');
                result.games = [...result.games, ...communityOnlyGames];
            } else {
                console.log('[SteamService] No additional games found in community library');
            }

            console.log('[SteamService] === END COMMUNITY LIBRARY FALLBACK ===');
            console.log('[SteamService] Final owned games count:', result.games.length);

            // 4. Store in Cache (only if successful and not unknown)
            if (result.privacyState !== 'unknown') {
                cache.set(cacheKey, result, CACHE_TTL_MS);
            }

            return result;
        } catch (error: any) {
            console.error('[SteamService] Error fetching owned games:', error);
            // Return structured error instead of generic unknown
            return {
                games: [],
                privacyState: 'unknown',
                error: 'STEAM_FETCH_FAILED',
                errorMessage: error?.message || 'Unknown error occurred'
            };
        }
    }

    /**
     * Invalidate cache for a specific Steam ID
     * Called after Steam link completion or privacy change
     */
    invalidateCache(steamId64: string): void {
        const cacheKey = `steam:ownedGames:${steamId64}`;
        cache.delete(cacheKey);
        console.log(`[SteamService] Cache invalidated for ${steamId64}`);
    }
}

export const steamService = new SteamService();

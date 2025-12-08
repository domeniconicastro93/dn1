/**
 * Steam Community Library Scraper
 * 
 * PHASE 2.6: Final fallback for ownership detection
 * 
 * Scrapes the public Steam Community library page to detect games
 * that are in the user's library but not detected by:
 * - GetOwnedGames (Phase 2)
 * - F2P Detection (Phase 2.5)
 * 
 * This is a BEST-EFFORT fallback that gracefully degrades if unavailable.
 */

import fetch from 'node-fetch';

/**
 * Fetch AppIDs from Steam Community library page
 * 
 * URL: https://steamcommunity.com/profiles/{steamId}/games/?tab=all
 * 
 * The page contains a JavaScript variable like:
 * var rgGames = [{"appid":730,"name":"Counter-Strike 2",...}, ...]
 * 
 * We extract and parse this JSON to get all AppIDs.
 * 
 * @param steamId64 - User's Steam ID
 * @returns Set of AppIDs found in the library
 */
export async function fetchCommunityLibraryAppIds(steamId64: string): Promise<Set<number>> {
    const DEBUG = process.env.DEBUG_STEAM === 'true';

    try {
        const url = `https://steamcommunity.com/profiles/${steamId64}/games/?tab=all`;

        if (DEBUG) {
            console.log('[Community Library] Fetching library from:', url);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.warn('[Community Library] HTTP error:', response.status);
            return new Set();
        }

        const html = await response.text();

        if (DEBUG) {
            console.log('[Community Library] HTML length:', html.length);
        }

        // Extract rgGames variable from HTML
        // Pattern: var rgGames = [{...}];
        const rgGamesMatch = html.match(/var\s+rgGames\s*=\s*(\[[\s\S]*?\]);/);

        if (!rgGamesMatch) {
            console.warn('[Community Library] Could not find rgGames variable in HTML');

            // Try alternative pattern: rgGames = [{...}];
            const altMatch = html.match(/rgGames\s*=\s*(\[[\s\S]*?\]);/);

            if (!altMatch) {
                console.warn('[Community Library] Could not find rgGames with alternative pattern');
                return new Set();
            }

            return parseRgGames(altMatch[1], DEBUG);
        }

        return parseRgGames(rgGamesMatch[1], DEBUG);

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('[Community Library] Request timeout');
        } else {
            console.error('[Community Library] Error fetching library:', error.message);
        }
        return new Set();
    }
}

/**
 * Parse rgGames JSON array
 * 
 * @param jsonString - JSON string to parse
 * @param debug - Enable debug logging
 * @returns Set of AppIDs
 */
function parseRgGames(jsonString: string, debug: boolean): Set<number> {
    try {
        const games = JSON.parse(jsonString);

        if (!Array.isArray(games)) {
            console.warn('[Community Library] rgGames is not an array');
            return new Set();
        }

        const appIds = new Set<number>();

        for (const game of games) {
            if (game && typeof game.appid === 'number') {
                appIds.add(game.appid);
            }
        }

        if (debug) {
            console.log('[Community Library] Found', appIds.size, 'games in library');
            console.log('[Community Library] Sample AppIDs:', Array.from(appIds).slice(0, 10));
        }

        return appIds;

    } catch (error: any) {
        console.error('[Community Library] JSON parse error:', error.message);
        return new Set();
    }
}

/**
 * Check if a specific AppID is in the community library
 * 
 * This is a convenience wrapper around fetchCommunityLibraryAppIds
 * for checking a single game.
 * 
 * @param steamId64 - User's Steam ID
 * @param appId - Game AppID to check
 * @returns true if game is in library
 */
export async function isInCommunityLibrary(steamId64: string, appId: number): Promise<boolean> {
    const appIds = await fetchCommunityLibraryAppIds(steamId64);
    return appIds.has(appId);
}

/**
 * MAINTENANCE NOTES:
 * 
 * If Valve changes the HTML structure, update the regex patterns:
 * 
 * Current patterns:
 * 1. var rgGames = [{...}];
 * 2. rgGames = [{...}];
 * 
 * Alternative patterns to try if these fail:
 * 3. window.rgGames = [{...}];
 * 4. Look for <script> tag containing game data
 * 5. Check for JSON-LD structured data
 * 
 * The JSON structure should remain stable:
 * {
 *   "appid": number,
 *   "name": string,
 *   "logo": string,
 *   "friendlyURL": string,
 *   "availStatLinks": {...},
 *   "hours_forever": string,
 *   "last_played": number
 * }
 */

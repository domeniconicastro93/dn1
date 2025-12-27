import fetch from 'node-fetch';
import type { SteamWebMetadata } from './types';
import { STEAM_WEB_LANGUAGE, STEAM_API_KEY } from './env';
import { fetchSteamXMLPrivacy } from './steam-xml-privacy';

export interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    img_logo_url: string;
}

export interface LibraryResult {
    games: OwnedGame[];
    privacyState: 'public' | 'private' | 'unknown';
    error?: string; // Error code like 'STEAM_NOT_LINKED', 'STEAM_FETCH_FAILED'
    errorMessage?: string; // Human-readable error message
}

/**
 * ============================================================
 *  ⚠️ PRIVACY MODEL & FULL LIBRARY FETCH
 * ============================================================
 * 
 * PHASE 2 ENFORCEMENT:
 * 1. Check XML privacy FIRST (authoritative source)
 * 2. If private → return empty immediately
 * 3. If public → fetch games with all params
 * 
 * We use the following params to ensure we get EVERYTHING:
 * - include_appinfo=1        -> Get names and images
 * - include_played_free_games=1 -> Get F2P games (CS2, Dota 2, etc.)
 * - include_free_sub=1       -> Get free subscriptions
 * - skip_unvetted_apps=0     -> Get everything, even if unvetted
 * ============================================================
 */

export async function getOwnedGames(steamId64: string): Promise<LibraryResult> {
    // CRITICAL GUARD: Never call Steam API without valid steamId64
    if (!steamId64 || steamId64.trim() === '') {
        console.error('[STEAM API TRACE] ❌ STEAM_API_CALLED_WITHOUT_STEAMID');
        console.error('[STEAM API TRACE] Request blocked before Steam call');
        console.error('[STEAM API TRACE] steamId64 received:', steamId64 || 'NULL/EMPTY');
        return {
            games: [],
            privacyState: 'unknown'
        };
    }

    // Enhanced diagnostic logging - toggleable via STEAM_DEBUG_LOG
    const DEBUG_STEAM = process.env.STEAM_DEBUG_LOG === 'true' || process.env.DEBUG_STEAM === 'true';
    const startTime = Date.now();

    console.log('[STEAM API TRACE] ==========================================');
    console.log('[STEAM API TRACE] getOwnedGames called');
    console.log('[STEAM API TRACE] steamId64:', '...' + steamId64.slice(-4));

    if (DEBUG_STEAM) {
        console.log(`[SteamWebAPI] 🔍 === START STEAM API CALL ===`);
        console.log(`[SteamWebAPI] 🔍 Fetching owned games for SteamID: ${steamId64}`);
        console.log(`[SteamWebAPI] 🔍 Timestamp: ${new Date().toISOString()}`);
    }

    if (!STEAM_API_KEY) {
        console.error('[SteamWebAPI] ❌ FATAL ERROR: Missing STEAM_API_KEY');
        return {
            games: [],
            privacyState: 'unknown',
            error: 'MISSING_API_KEY',
            errorMessage: 'Steam API key not configured'
        };
    }

    // ============================================================
    // PHASE 2: AUTHORITATIVE XML PRIVACY CHECK
    // ============================================================
    console.log('[SteamWebAPI] 🔒 STEP 1: Checking privacy via XML...');
    const xmlPrivacy = await fetchSteamXMLPrivacy(steamId64);

    console.log('[SteamWebAPI] 🔒 XML Privacy Result:', xmlPrivacy);

    // If private, STOP HERE and return empty
    if (xmlPrivacy === 'private') {
        console.log('[SteamWebAPI] ❌ Profile is PRIVATE - returning no games');
        return {
            games: [],
            privacyState: 'private',
        };
    }

    // If unknown, treat as private (fail-safe)
    if (xmlPrivacy === 'unknown') {
        console.warn('[SteamWebAPI] ⚠️ Could not determine privacy - treating as private (fail-safe)');
        return {
            games: [],
            privacyState: 'unknown',
        };
    }


    // Privacy is PUBLIC - proceed to fetch games
    console.log('[SteamWebAPI] ✅ Profile is PUBLIC - proceeding to fetch games...');
    // ============================================================

    // CRITICAL PARAMS FOR FULL LIBRARY:
    // - skip_unvetted_apps=false (0) -> Include ALL games, even unvetted/hidden
    // - include_played_free_games=1 -> Include F2P games (CS2, Dota, TF2, etc.)
    // - include_appinfo=1 -> Include game names and images
    // - include_free_sub=1 -> Include free subscriptions
    const params = new URLSearchParams({
        key: STEAM_API_KEY,
        steamid: steamId64,
        include_appinfo: '1',
        include_played_free_games: '1',
        include_free_sub: '1',
        skip_unvetted_apps: '0', // FALSE = include unvetted apps
        format: 'json'
    });

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${params.toString()}`;

    // Always log for debugging
    console.log(`[SteamWebAPI] 📡 Request URL: ${url.replace(STEAM_API_KEY, '***REDACTED***')}`);

    if (DEBUG_STEAM) {
        console.log(`[SteamWebAPI] 📡 Parameters:`);
        console.log(`[SteamWebAPI]    - steamid: ${steamId64}`);
        console.log(`[SteamWebAPI]    - include_appinfo: 1`);
        console.log(`[SteamWebAPI]    - include_played_free_games: 1`);
        console.log(`[SteamWebAPI]    - include_free_sub: 1`);
        console.log(`[SteamWebAPI]    - skip_unvetted_apps: 0 (FALSE - include all)`);
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const elapsedMs = Date.now() - startTime;

        if (DEBUG_STEAM) {
            console.log(`[SteamWebAPI] 📥 Response Status: ${response.status} ${response.statusText}`);
            console.log(`[SteamWebAPI] ⏱️  Response Time: ${elapsedMs}ms`);
        }

        if (!response.ok) {
            console.error(`[SteamWebAPI] ❌ Steam API returned error: ${response.status} ${response.statusText}`);
            console.error(`[SteamWebAPI] ❌ Elapsed time: ${elapsedMs}ms`);
            return { games: [], privacyState: 'unknown' };
        }

        const data = await response.json();
        const result = data?.response;

        if (DEBUG_STEAM) {
            console.log(`[SteamWebAPI] 📥 Raw Response:`, JSON.stringify(result, null, 2));
            console.log(`[SteamWebAPI] 📊 Response Analysis:`);
            console.log(`[SteamWebAPI]    - Has 'response' object: ${!!result}`);
            console.log(`[SteamWebAPI]    - Has 'games' array: ${!!result?.games}`);
            console.log(`[SteamWebAPI]    - game_count: ${result?.game_count ?? 'undefined'}`);
            console.log(`[SteamWebAPI]    - games.length: ${result?.games?.length ?? 0}`);
        }

        // Privacy detection logic
        if (!result || (Object.keys(result).length === 0 && result.game_count === undefined)) {
            console.log('[SteamWebAPI] 🔒 PRIVATE library detected (empty response object)');
            if (DEBUG_STEAM) console.log(`[SteamWebAPI] ⏱️  Total elapsed: ${Date.now() - startTime}ms`);
            return { games: [], privacyState: 'private' };
        }

        // Case: PUBLIC with actual games
        if (result.games && result.games.length > 0) {
            console.log(`[SteamWebAPI] ✅ SUCCESS: User owns ${result.games.length} games (PUBLIC library)`);
            console.log('[STEAM API TRACE] totalOwnedGames =', result.games.length);
            console.log('[STEAM API TRACE] ==========================================');

            // CRITICAL: Log ALL AppIDs for debugging
            console.log('[SteamWebAPI] 🎮 ALL OWNED APPIDS:');
            const allAppIds = result.games.map((g: any) => g.appid);
            console.log('[SteamWebAPI]', allAppIds.join(', '));

            // Log all game names
            console.log('[SteamWebAPI] 🎮 ALL OWNED GAMES:');
            result.games.forEach((g: any, idx: number) => {
                console.log(`[SteamWebAPI]    ${idx + 1}. ${g.name} (AppID: ${g.appid}, Playtime: ${g.playtime_forever}min)`);
            });

            if (DEBUG_STEAM) {
                console.log(`[SteamWebAPI] ⏱️  Total elapsed: ${Date.now() - startTime}ms`);
                console.log(`[SteamWebAPI] 🔍 === END STEAM API CALL ===\n`);
            }
            return {
                games: result.games.map((g: any) => ({
                    appid: g.appid,
                    name: g.name,
                    playtime_forever: g.playtime_forever,
                    img_icon_url: g.img_icon_url || '',
                    img_logo_url: g.img_logo_url || '',
                })),
                privacyState: 'public',
            };
        }

        // Case: PUBLIC but empty library
        if (result.game_count === 0) {
            console.log('[SteamWebAPI] ⚠️ Library is PUBLIC but empty (game_count=0)');
            if (DEBUG_STEAM) console.log(`[SteamWebAPI] ⏱️  Total elapsed: ${Date.now() - startTime}ms`);
            return {
                games: [],
                privacyState: 'public',
            };
        }

        // Case: MISSING "games" field but has other data -> Likely PRIVATE
        if (!result.games) {
            console.log('[SteamWebAPI] 🔒 PRIVATE library detected (missing games property)');
            if (DEBUG_STEAM) console.log(`[SteamWebAPI] ⏱️  Total elapsed: ${Date.now() - startTime}ms`);
            return {
                games: [],
                privacyState: 'private',
            };
        }

        // Fallback
        console.log('[SteamWebAPI] ❓ Unknown state (fallback)');
        if (DEBUG_STEAM) console.log(`[SteamWebAPI] ⏱️  Total elapsed: ${Date.now() - startTime}ms`);
        return { games: [], privacyState: 'unknown' };

    } catch (error: any) {
        const elapsedMs = Date.now() - startTime;
        console.error('[SteamWebAPI] 💥 EXCEPTION during Steam API call');
        console.error('[SteamWebAPI] 💥 Error:', error.message);
        console.error('[SteamWebAPI] 💥 Error type:', error.name);
        if (error.name === 'AbortError') {
            console.error('[SteamWebAPI] 💥 Request timed out after 10000ms');
        }
        console.error(`[SteamWebAPI] 💥 Elapsed time: ${elapsedMs}ms`);
        if (DEBUG_STEAM) {
            console.error('[SteamWebAPI] 💥 Full error stack:', error.stack);
        }
        return { games: [], privacyState: 'unknown' };
    }
}

/**
 * ============================================================
 *                STEAM STORE METADATA
 * ============================================================
 */

interface SteamAppDetailsEnvelope {
    [key: string]: {
        success: boolean;
        data?: {
            name?: string;
            short_description?: string;
            header_image?: string;
            screenshots?: Array<{ path_thumbnail: string }>;
            genres?: Array<{ description: string }>;
            last_update?: number;
        };
    };
}

export async function fetchSteamMetadata(appId: string): Promise<SteamWebMetadata | undefined> {
    try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=${STEAM_WEB_LANGUAGE}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) return undefined;

        const payload = (await response.json()) as SteamAppDetailsEnvelope;
        const record = payload[appId];

        if (!record?.success || !record.data) return undefined;

        return {
            description: record.data.short_description,
            headerImage: record.data.header_image,
            genres: record.data.genres?.map((g) => g.description),
            screenshots: record.data.screenshots?.map((s) => s.path_thumbnail),
            lastUpdated: record.data.last_update
                ? new Date(record.data.last_update * 1000).toISOString()
                : undefined,
        };
    } catch (error) {
        console.error('[SteamWebAPI] Metadata fetch failed:', error);
        return undefined;
    }
}

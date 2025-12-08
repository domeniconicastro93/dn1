"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnedGames = getOwnedGames;
exports.fetchSteamMetadata = fetchSteamMetadata;
const node_fetch_1 = __importDefault(require("node-fetch"));
const env_1 = require("./env");
async function getPlayerPrivacyState(steamId64) {
    if (!env_1.STEAM_API_KEY)
        return 'unknown';
    try {
        const url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${env_1.STEAM_API_KEY}&steamids=${steamId64}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await (0, node_fetch_1.default)(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
            console.error(`[SteamWebAPI] GetPlayerSummaries error: ${response.status}`);
            return 'unknown';
        }
        const data = await response.json();
        const players = data.response?.players;
        if (!players || players.length === 0) {
            console.log(`[STEAM PRIVACY] steamId: ${steamId64} - No player found`);
            return 'unknown';
        }
        const player = players[0];
        const communityvisibilitystate = player.communityvisibilitystate;
        const profilestate = player.profilestate;
        const personaname = player.personaname;
        // REQUIRED LOGGING
        console.log(`[STEAM PRIVACY]
steamId: ${steamId64}
privacy: ${communityvisibilitystate === 3 ? 'public' : (communityvisibilitystate === 1 ? 'private' : 'unknown')}
communityvisibilitystate: ${communityvisibilitystate}
profilestate: ${profilestate}
personaname: ${personaname}`);
        // Interpret privacy EXACTLY as:
        // 3	Public	Show owned games, no banner
        // 1	Private	Show banner + empty library
        // 2    Friends Only Show banner + empty library
        // Anything else	Unknown	Show banner
        if (communityvisibilitystate === 3)
            return 'public';
        if (communityvisibilitystate === 1)
            return 'private';
        if (communityvisibilitystate === 2)
            return 'friendsOnly';
        return 'unknown';
    }
    catch (e) {
        console.error('[SteamWebAPI] GetPlayerSummaries failed:', e);
        return 'unknown';
    }
}
async function getOwnedGames(steamId64) {
    if (!env_1.STEAM_API_KEY) {
        console.error('[SteamWebAPI] Missing STEAM_API_KEY');
        return { games: [], privacyState: 'unknown' };
    }
    try {
        // Fetch Owned Games
        // MUST USE ONLY: include_appinfo=1 include_played_free_games=1
        const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${env_1.STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1&format=json`;
        console.log(`[SteamWebAPI] Fetching owned games for ${steamId64}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await (0, node_fetch_1.default)(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
            console.error(`[SteamWebAPI] Error response: ${response.status} ${response.statusText}`);
            return { games: [], privacyState: 'unknown' };
        }
        const data = await response.json();
        console.log('[SteamWebAPI] Full Response:', JSON.stringify(data, null, 2));
        // IF the Steam API returns an error OR empty body:
        if (!data || !data.response) {
            console.log('[SteamWebAPI] Empty response body');
            return { games: [], privacyState: 'unknown' };
        }
        // IF Steam API returns "success: false" (rare for GetOwnedGames, but checking)
        // Note: GetOwnedGames usually returns empty response object for private
        // Checking for empty response object which usually implies private
        if (Object.keys(data.response).length === 0) {
            console.log('[SteamWebAPI] Response object is empty -> Private');
            return { games: [], privacyState: 'private' };
        }
        const games = data.response.games;
        // IF "games" array exists AND length > 0:
        if (games && Array.isArray(games) && games.length > 0) {
            // REQUIRED LOGGING
            const appIds = games.map((g) => g.appid);
            console.log(`[STEAM OWNED GAMES]
count: ${games.length}
first 20 appids: ${appIds.slice(0, 20).join(', ')}`);
            return {
                games: games.map((g) => ({
                    appid: g.appid,
                    name: g.name,
                    playtime_forever: g.playtime_forever,
                    img_icon_url: g.img_icon_url || '',
                    img_logo_url: g.img_logo_url || '',
                })),
                privacyState: 'public'
            };
        }
        // ELSE IF response.games is empty array:
        if (games && Array.isArray(games) && games.length === 0) {
            console.log('[SteamWebAPI] Games array is empty -> Public (Empty Library)');
            return { games: [], privacyState: 'public' };
        }
        // ELSE (e.g. games property missing but response not empty?)
        console.log('[SteamWebAPI] Games property missing -> Private');
        return { games: [], privacyState: 'private' };
    }
    catch (error) {
        console.error('[SteamWebAPI] Exception fetching owned games:', error);
        return { games: [], privacyState: 'unknown' };
    }
}
async function fetchSteamMetadata(appId) {
    try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=${env_1.STEAM_WEB_LANGUAGE}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await (0, node_fetch_1.default)(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
            return undefined;
        }
        const payload = (await response.json());
        const record = payload[appId];
        if (!record?.success || !record.data) {
            return undefined;
        }
        return {
            description: record.data.short_description,
            headerImage: record.data.header_image,
            genres: record.data.genres?.map((genre) => genre.description),
            screenshots: record.data.screenshots?.map((shot) => shot.path_thumbnail),
            lastUpdated: record.data.last_update
                ? new Date(record.data.last_update * 1000).toISOString()
                : undefined,
        };
    }
    catch {
        return undefined;
    }
}

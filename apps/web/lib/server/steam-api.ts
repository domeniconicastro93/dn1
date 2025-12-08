import type {
  SteamOwnedGameDTO,
  SteamOwnedLibraryResponse,
  SteamProfileDTO,
} from '@strike/shared-types';
import { ensureSteamKey } from './steam-openid';

const OWNED_CACHE = new Map<
  string,
  { response: SteamOwnedLibraryResponse; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface SteamOwnedGamesAPIResponse {
  response: {
    game_count?: number;
    games?: Array<{
      appid: number;
      name?: string;
      playtime_forever?: number;
      img_icon_url?: string;
      img_logo_url?: string;
      has_community_visible_stats?: boolean;
      rtime_last_played?: number;
    }>;
  };
}

interface SteamPlayerSummariesResponse {
  response: {
    players: Array<{
      steamid: string;
      personaname?: string;
      profileurl?: string;
      avatarfull?: string;
      loccountrycode?: string;
    }>;
  };
}

const COMMUNITY_IMAGE_BASE = 'https://media.steampowered.com/steamcommunity/public/images/apps';

function buildImageUrl(appId: number, hash?: string): string | undefined {
  if (!hash) return undefined;
  return `${COMMUNITY_IMAGE_BASE}/${appId}/${hash}.jpg`;
}

async function fetchOwnedGamesRaw(steamId64: string): Promise<SteamOwnedGameDTO[]> {
  const key = ensureSteamKey();
  const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
  url.searchParams.set('steamid', steamId64);
  url.searchParams.set('key', key);
  url.searchParams.set('include_appinfo', '1');
  url.searchParams.set('include_played_free_games', '1');

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Steam API error (${res.status})`);
  }
  const data = (await res.json()) as SteamOwnedGamesAPIResponse;
  const games = data.response.games || [];

  return games.map((game) => ({
    appId: String(game.appid),
    title: game.name || `App ${game.appid}`,
    playtimeMinutes: game.playtime_forever,
    iconUrl: buildImageUrl(game.appid, game.img_icon_url),
    logoUrl: buildImageUrl(game.appid, game.img_logo_url),
    hasCommunityVisibleStats: game.has_community_visible_stats,
    lastUpdated: game.rtime_last_played
      ? new Date(game.rtime_last_played * 1000).toISOString()
      : undefined,
  }));
}

async function fetchSteamProfile(steamId64: string): Promise<SteamProfileDTO | undefined> {
  const key = ensureSteamKey();
  const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
  url.searchParams.set('steamids', steamId64);
  url.searchParams.set('key', key);

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return undefined;
  }
  const json = (await res.json()) as SteamPlayerSummariesResponse;
  const profile = json.response.players?.[0];
  if (!profile) return undefined;
  return {
    steamId64: profile.steamid,
    personaName: profile.personaname,
    avatar: profile.avatarfull,
    profileUrl: profile.profileurl,
    countryCode: profile.loccountrycode,
  };
}

export async function getOwnedGames(
  steamId64: string,
  options: { forceRefresh?: boolean } = {}
): Promise<SteamOwnedLibraryResponse> {
  const cacheKey = steamId64;
  const cached = OWNED_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now && !options.forceRefresh) {
    return { ...cached.response, cached: true };
  }

  const games = await fetchOwnedGamesRaw(steamId64);
  const profile = await fetchSteamProfile(steamId64);

  const response: SteamOwnedLibraryResponse = {
    steamId64,
    profile,
    games,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };
  OWNED_CACHE.set(cacheKey, { response, expiresAt: now + CACHE_TTL_MS });
  return response;
}

export async function getSteamProfile(steamId64: string): Promise<SteamProfileDTO | undefined> {
  return fetchSteamProfile(steamId64);
}


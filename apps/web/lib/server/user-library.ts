import { getAccessToken } from './strike-auth';

export interface OwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
}

export async function fetchUserLibrary(): Promise<{ ownedGames: OwnedGame[], totalCount: number, privacyState: 'public' | 'private' | 'friendsOnly' | 'unknown' }> {
  const token = await getAccessToken();
  if (!token) return { ownedGames: [], totalCount: 0, privacyState: 'unknown' };

  const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${gatewayUrl}/api/steam/v1/library`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('[UserLibrary] Failed to fetch library:', res.status);
      return { ownedGames: [], totalCount: 0, privacyState: 'unknown' };
    }

    const data = await res.json();
    const ownedGames = data.data?.ownedGames || [];
    const privacyState = data.data?.privacyState || 'unknown';

    console.log(`[UserLibrary] Fetched ${ownedGames.length} owned games. Privacy: ${privacyState}`);

    return {
      ownedGames,
      totalCount: data.data?.totalCount || 0,
      privacyState
    };
  } catch (e) {
    console.error('[UserLibrary] Exception fetching library:', e);
    return { ownedGames: [], totalCount: 0, privacyState: 'unknown' };
  }
}

export const loadUserOwnedGames = async () => (await fetchUserLibrary()).ownedGames.map(g => g.appid.toString());

export async function loadUserLibrary(): Promise<any> {
  const { ownedGames } = await fetchUserLibrary();
  const ids = ownedGames.map(g => g.appid.toString());
  return {
    steamId64: 'mock',
    entries: ids.map(id => ({
      appId: id,
      steamAppId: id,
      name: `Steam App ${id}`,
      title: `Steam App ${id}`,
      headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
      playtime: 0,
      lastPlayed: 0,
      status: 'ready',
      owned: true,
      installed: false
    })),
    counts: {
      total: ids.length,
      games: ids.length,
      dlc: 0
    },
    fetchedAt: new Date().toISOString()
  };
}

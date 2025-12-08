export interface SteamOwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    img_logo_url: string;
}

export interface SteamOwnedGamesResponse {
    ownedGames: SteamOwnedGame[];
    totalCount: number;
    privacyState: 'public' | 'private' | 'friendsOnly' | 'unknown';
}

export async function fetchSteamOwnedGames(): Promise<SteamOwnedGamesResponse> {
    const response = await fetch('/api/steam/owned-games', {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Steam owned games');
    }

    return response.json();
}

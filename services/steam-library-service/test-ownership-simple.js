const STEAM_API_KEY = 'A7C258F4F68B663938D97D943F1F82D7';

async function getOwnedGames(steamId64) {
    if (!STEAM_API_KEY) {
        console.error('[SteamWebAPI] Missing STEAM_API_KEY');
        return [];
    }
    try {
        const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1&include_free_sub=1&format=json`;

        console.log(`[SteamWebAPI] Fetching owned games for ${steamId64}...`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[SteamWebAPI] Error response: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        if (!data.response || !data.response.games) {
            console.warn('[SteamWebAPI] No games found in response');
            return [];
        }

        const games = data.response.games;
        console.log(`[SteamWebAPI] Returned ${games.length} games.`);

        return games.map((g) => ({
            appid: g.appid,
            name: g.name,
            playtime_forever: g.playtime_forever,
            img_icon_url: g.img_icon_url || '',
            img_logo_url: g.img_logo_url || '',
        }));
    } catch (error) {
        console.error('[SteamWebAPI] Exception fetching owned games:', error);
        return [];
    }
}

async function main() {
    const steamId = '76561198155371511';
    console.log(`Testing getOwnedGames for ${steamId}...`);
    const games = await getOwnedGames(steamId);
    console.log(`Returned ${games.length} games.`);

    const targetIds = ['1515950', '730', '805550'];
    targetIds.forEach(id => {
        const found = games.find(g => String(g.appid) === id);
        console.log(`AppID ${id}: ${found ? 'FOUND' : 'NOT FOUND'}`);
    });
}

main();

import fetch from 'node-fetch';

const STEAM_ID = '76561198763654695'; // domeniconicastro3
const STEAM_API_KEY = 'A7C258F4F68B663938D97D943F1F82D7';

async function debugPrivacy() {
    console.log(`Debugging privacy for ${STEAM_ID}...`);

    // 1. Check XML
    const xmlUrl = `https://steamcommunity.com/profiles/${STEAM_ID}?xml=1`;
    console.log(`\n[XML] Fetching ${xmlUrl}`);
    try {
        const res = await fetch(xmlUrl);
        const text = await res.text();
        console.log('[XML] Response Status:', res.status);

        const privacyMatch = text.match(/<privacyState>(\w+)<\/privacyState>/);
        const visibilityMatch = text.match(/<visibilityState>(\d+)<\/visibilityState>/);

        console.log('[XML] <privacyState>:', privacyMatch ? privacyMatch[1] : 'NOT FOUND');
        console.log('[XML] <visibilityState>:', visibilityMatch ? visibilityMatch[1] : 'NOT FOUND');

        // Log first 500 chars to see structure if needed
        console.log('[XML] Snippet:', text.substring(0, 500).replace(/\n/g, ' '));
    } catch (e) {
        console.error('[XML] Error:', e);
    }

    // 2. Check API
    const apiUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`;
    console.log(`\n[API] Fetching ${apiUrl.replace(STEAM_API_KEY, 'HIDDEN')}`);
    try {
        const res = await fetch(apiUrl);
        const data = await res.json() as any;
        const player = data.response?.players?.[0];

        if (player) {
            console.log('[API] communityvisibilitystate:', player.communityvisibilitystate);
            console.log('[API] profilestate:', player.profilestate);
        } else {
            console.log('[API] Player not found in response');
        }
    } catch (e) {
        console.error('[API] Error:', e);
    }

    // 3. Check Games
    const gamesUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1&format=json`;
    console.log(`\n[GAMES] Fetching games...`);
    try {
        const res = await fetch(gamesUrl);
        const data = await res.json() as any;
        const count = data.response?.game_count || 0;
        console.log('[GAMES] Count:', count);
    } catch (e) {
        console.error('[GAMES] Error:', e);
    }
}

debugPrivacy();

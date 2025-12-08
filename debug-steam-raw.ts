import fetch from 'node-fetch';

const STEAM_API_KEY = 'A7C258F4F68B663938D97D943F1F82D7';
const STEAM_ID_2 = '76561198763654695'; // Check if this is domeniconicastro3

async function checkSteamId(steamId: string, label: string) {
    // 1. Check Privacy (API)
    const privacyUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    console.log(`\n--- Checking Privacy (API) for ${label} (${steamId}) ---`);
    try {
        const res = await fetch(privacyUrl);
        const data = await res.json() as any;
        const player = data.response?.players?.[0];
        if (player) {
            console.log('communityvisibilitystate:', player.communityvisibilitystate);
            // 1 - Private, 2 - FriendsOnly, 3 - Public
            if (player.communityvisibilitystate === 3) {
                console.log('Privacy: Public');
            } else {
                console.log('Privacy: Private/FriendsOnly');
            }
        } else {
            console.log('Player profile not found.');
        }
    } catch (err) {
        console.error('Error checking privacy:', err);
    }

    // 2. Check Privacy (XML)
    const xmlUrl = `https://steamcommunity.com/profiles/${steamId}?xml=1`;
    console.log(`\n--- Checking Privacy (XML) for ${label} (${steamId}) ---`);
    try {
        const res = await fetch(xmlUrl);
        const text = await res.text();
        // Simple regex check for privacyState
        const match = text.match(/<privacyState>(\w+)<\/privacyState>/);
        if (match) {
            console.log('XML privacyState:', match[1]);
        } else {
            console.log('XML privacyState not found in response.');
            console.log('First 200 chars:', text.substring(0, 200));
        }
    } catch (err) {
        console.error('Error checking XML:', err);
    }

    // 3. Check Owned Games
    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;

    console.log(`\n--- Checking Games for ${label} (${steamId}) ---`);
    console.log(`URL: ${url.replace(STEAM_API_KEY, 'HIDDEN_KEY')}`);

    try {
        const res = await fetch(url);
        const data = await res.json() as any;

        console.log('Response Status:', res.status);
        if (data.response) {
            const count = data.response.game_count || 0;
            const games = data.response.games || [];
            console.log(`Game Count: ${count}`);
            console.log(`Games Array Length: ${games.length}`);
            if (games.length > 0) {
                console.log('First 3 games:', games.slice(0, 3).map((g: any) => `${g.name} (${g.appid})`));
                const capcom = games.find((g: any) => g.appid === 1515950);
                if (capcom) {
                    console.log('OWNS Capcom Arcade Stadium (1515950)');
                } else {
                    console.log('DOES NOT OWN Capcom Arcade Stadium (1515950)');
                }
            } else {
                console.log('No games found in response.');
                console.log('Raw Response:', JSON.stringify(data, null, 2));
            }
        } else {
            console.log('Invalid response structure:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

async function main() {
    await checkSteamId(STEAM_ID_2, 'Account B');
}

main();

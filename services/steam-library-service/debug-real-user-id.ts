
import fetch from 'node-fetch';

const STEAM_API_KEY = 'A7C258F4F68B663938D97D943F1F82D7';
// Try the ID from previous logs directly
const STEAM_ID_64 = '76561198155371511';

async function main() {
    console.log(`Checking SteamID64: ${STEAM_ID_64}...`);

    try {
        // 2. Get Owned Games
        const ownedUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID_64}&include_appinfo=true&include_played_free_games=1&format=json`;
        console.log(`Fetching owned games...`);

        const ownedRes = await fetch(ownedUrl);
        if (!ownedRes.ok) {
            console.error(`Error fetching games: ${ownedRes.status} ${ownedRes.statusText}`);
            return;
        }

        const ownedData = await ownedRes.json() as any;
        const games = ownedData.response?.games || [];

        console.log(`Found ${games.length} games.`);

        // Check for specific games
        const capcom = games.find((g: any) => g.appid === 1515950);
        const assetto = games.find((g: any) => g.appid === 805550); // Assetto Corsa Competizione AppID

        if (capcom) console.log('SUCCESS: Capcom Arcade Stadium (1515950) found!');
        else console.log('FAILURE: Capcom Arcade Stadium (1515950) NOT found.');

        if (assetto) console.log('SUCCESS: Assetto Corsa Competizione (805550) found!');
        else console.log('FAILURE: Assetto Corsa Competizione (805550) NOT found.');

        if (games.length === 0) {
            console.log('\nPOSSIBLE CAUSE: The game list is empty. This usually means the Steam Profile "Game Details" privacy setting is set to "Private" or "Friends Only". It must be "Public".');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

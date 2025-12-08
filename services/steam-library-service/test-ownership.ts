import { getOwnedGames } from './src/steam-web-api';
import 'dotenv/config';

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

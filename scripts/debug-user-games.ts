
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY || 'A7C258F4F68B663938D97D943F1F82D7'; // Fallback to key from debug file

async function main() {
    const email = 'domenico.ncsnicastro@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('User not found in DB');
        return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`Steam ID: ${user.steamId64}`);

    if (!user.steamId64) {
        console.error('Steam ID is NULL. User needs to link account.');
        return;
    }

    const steamId64 = user.steamId64;

    // 1. XML Privacy Check
    console.log('\n--- XML PRIVACY CHECK ---');
    const xmlUrl = `https://steamcommunity.com/profiles/${steamId64}?xml=1`;
    try {
        const xmlRes = await fetch(xmlUrl);
        const xmlText = await xmlRes.text();

        const privacyStateMatch = xmlText.match(/<privacyState>([^<]+)<\/privacyState>/i);
        const visibilityStateMatch = xmlText.match(/<communityvisibilitystate>(\d+)<\/communityvisibilitystate>/i);

        console.log(`privacyState: ${privacyStateMatch?.[1]}`);
        console.log(`communityvisibilitystate: ${visibilityStateMatch?.[1]}`);

        if (privacyStateMatch?.[1] !== 'public' && visibilityStateMatch?.[1] !== '3') {
            console.warn('WARNING: Profile appears PRIVATE via XML check.');
        } else {
            console.log('Profile appears PUBLIC via XML check.');
        }
    } catch (e) {
        console.error('XML Check failed:', e);
    }

    // 2. API Fetch
    console.log('\n--- API FETCH CHECK ---');
    const params = new URLSearchParams({
        key: STEAM_API_KEY,
        steamid: steamId64,
        include_appinfo: '1',
        include_played_free_games: '1',
        include_free_sub: '1',
        skip_unvetted_apps: '0',
        format: 'json'
    });
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${params.toString()}`;

    try {
        const res = await fetch(url);
        const data = await res.json() as any;

        if (data.response && data.response.games) {
            console.log(`SUCCESS: Found ${data.response.games.length} games.`);

            // Check for Capcom
            const capcom = data.response.games.find((g: any) => g.appid === 1515950);
            console.log(`Capcom Arcade Stadium (1515950): ${capcom ? 'FOUND' : 'NOT FOUND'}`);

            // Check for Assetto Corsa
            const assetto = data.response.games.find((g: any) => g.appid === 244210);
            console.log(`Assetto Corsa (244210): ${assetto ? 'FOUND' : 'NOT FOUND'}`);
        } else {
            console.error('FAILURE: No games found in API response. Response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('API Fetch failed:', e);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

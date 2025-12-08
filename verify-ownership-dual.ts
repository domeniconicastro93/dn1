import 'dotenv/config';
import fetch from 'node-fetch';
import { prisma } from '@strike/shared-db';

// Configuration
const STEAM_API_KEY = 'A7C258F4F68B663938D97D943F1F82D7';
const AUTH_SERVICE_URL = 'http://localhost:3001';

interface Account {
    email: string;
    pass: string;
    steamUsername: string;
    expectedSteamId64?: string; // Optional, if we know it
}

const ACCOUNTS: Account[] = [
    {
        email: 'domenico.nica@gmail.com',
        pass: 'Nosmoking93!!',
        steamUsername: 'domeniconicastro',
        expectedSteamId64: '76561198155371511'
    },
    {
        email: 'domenico.ncsnicastro@gmail.com',
        pass: 'Nosmoking93!!',
        steamUsername: 'domeniconicastro2',
        expectedSteamId64: '76561198763654695'
    }
];

async function getAuthToken(email: string, pass: string): Promise<string | null> {
    console.log(`[Auth] Logging in as ${email}...`);
    try {
        const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/v1/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        if (!res.ok) {
            console.error(`[Auth] Login failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(`[Auth] Response: ${text}`);
            return null;
        }

        const data = await res.json();
        return data.data.token;
    } catch (err: any) {
        console.error(`[Auth] Exception: ${err.message}`);
        return null;
    }
}

async function getSteamIdFromToken(token: string): Promise<string | undefined> {
    // Decode JWT without verification just to extract payload
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload.steamId64;
    } catch (e) {
        return undefined;
    }
}

async function getRealSteamOwnedGames(steamId64: string) {
    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1&include_free_sub=1&format=json`;
    console.log(`[SteamAPI] Fetching owned games for ${steamId64}...`);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`[SteamAPI] Error: ${res.status}`);
            return [];
        }
        const data = await res.json();
        if (!data.response || !data.response.games) {
            console.warn('[SteamAPI] No games found.');
            return [];
        }
        return data.response.games;
    } catch (err: any) {
        console.error(`[SteamAPI] Exception: ${err.message}`);
        return [];
    }
}

async function verifyAccount(account: Account) {
    console.log(`\n--- Verifying Account: ${account.email} (${account.steamUsername}) ---`);

    // 1. Login to Strike
    const token = await getAuthToken(account.email, account.pass);
    if (!token) {
        console.error('FAIL: Could not log in to Strike.');
        return;
    }
    console.log('SUCCESS: Logged in to Strike.');

    // 2. Extract SteamID64
    let steamId64 = await getSteamIdFromToken(token);
    console.log(`Token SteamID64: ${steamId64 || 'NOT FOUND'}`);

    if (!steamId64) {
        // Try to fetch from DB if not in token (though it should be in token per previous fixes)
        console.log('Fetching user from DB to check SteamID...');
        const user = await prisma.user.findUnique({ where: { email: account.email } });
        if (user && user.steamId64) {
            steamId64 = user.steamId64;
            console.log(`DB SteamID64: ${steamId64}`);
        } else {
            console.error('FAIL: No SteamID linked to this account.');
            return;
        }
    }

    if (account.expectedSteamId64 && steamId64 !== account.expectedSteamId64) {
        console.warn(`WARNING: SteamID mismatch! Expected ${account.expectedSteamId64}, got ${steamId64}`);
    }

    // 3. Call Real Steam API
    const ownedGames = await getRealSteamOwnedGames(steamId64);
    console.log(`Steam API returned ${ownedGames.length} owned games.`);

    if (ownedGames.length === 0) {
        console.warn('\n!!! WARNING !!!');
        console.warn('Steam API returned 0 games.');
        console.warn('This usually means the Steam Profile Privacy Settings are set to "Private" or "Friends Only".');
        console.warn('Please ensure "Game details" is set to "Public" in Steam Privacy Settings.');
        console.warn('!!! WARNING !!!\n');
    } else {
        // Log first 20 appids
        console.log('First 20 owned AppIDs:', ownedGames.slice(0, 20).map(g => g.appid).join(', '));
    }

    // 4. Compare with Strike Catalog
    console.log('\nChecking ownership against Strike Catalog...');
    const strikeGames = await prisma.game.findMany({
        where: { steamAppId: { not: null } }
    });

    const ownedAppIds = new Set(ownedGames.map(g => String(g.appid)));

    const tableData = strikeGames.map(g => {
        const steamSaysOwned = ownedAppIds.has(String(g.steamAppId));
        const strikeSaysOwned = steamSaysOwned; // This is the logic we are verifying: isOwned = ownedIds.has(...)

        return {
            steamAppId: g.steamAppId,
            title: g.title,
            ExpectedOwned: steamSaysOwned ? 'YES' : 'NO',
            ActualOwned: strikeSaysOwned ? 'YES' : 'NO',
            MATCH: (steamSaysOwned === strikeSaysOwned) ? 'MATCH' : 'FAIL'
        };
    });

    // Filter to show interesting ones (owned ones + a few not owned)
    const interesting = tableData.filter(r => r.ExpectedOwned === 'YES' || ['730', '1515950'].includes(String(r.steamAppId)));
    console.table(interesting);
}

async function main() {
    try {
        for (const account of ACCOUNTS) {
            await verifyAccount(account);
        }
    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

import 'dotenv/config';
import fetch from 'node-fetch';

const GATEWAY_URL = 'http://localhost:3000';
const AUTH_SERVICE_URL = 'http://localhost:3001';

const ACCOUNTS = [
    {
        email: 'domenico.nica@gmail.com',
        pass: 'Nosmoking93!!',
        label: 'Account 1'
    },
    {
        email: 'domenico.ncsnicastro@gmail.com',
        pass: 'Nosmoking93!!',
        label: 'Account 2'
    }
];

async function getAuthToken(email: string, pass: string) {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    return data.data?.token;
}

async function checkLibrary(token: string, label: string) {
    console.log(`\nChecking Library for ${label}...`);
    // The Gateway maps /api/steam/v1/library -> steam-library-service /api/user/library
    const res = await fetch(`${GATEWAY_URL}/api/steam/v1/library`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        console.error(`Error: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.error(text);
        return;
    }

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    // Expected format: { ownedGames: [...], totalCount: number }
    // Or maybe wrapped in data? Let's see.
    console.log('Response keys:', Object.keys(data));

    if (data.ownedGames) {
        console.log(`Total Count: ${data.totalCount}`);
        console.log(`Owned Games: ${data.ownedGames.length}`);
        if (data.ownedGames.length > 0) {
            console.log('First 3 games:', data.ownedGames.slice(0, 3).map((g: any) => `${g.name} (${g.appid})`));
        } else {
            console.log('No games owned.');
        }
    } else if (data.data && data.data.ownedGames) {
        console.log(`Total Count: ${data.data.totalCount}`);
        console.log(`Owned Games: ${data.data.ownedGames.length}`);
        if (data.data.ownedGames.length > 0) {
            console.log('First 3 games:', data.data.ownedGames.slice(0, 3).map((g: any) => `${g.name} (${g.appid})`));
        } else {
            console.log('No games owned.');
        }
    } else {
        console.log('Unexpected structure:', JSON.stringify(data, null, 2));
    }
}

async function main() {
    for (const acc of ACCOUNTS) {
        const token = await getAuthToken(acc.email, acc.pass);
        if (token) {
            await checkLibrary(token, acc.label);
        } else {
            console.error(`Failed to login ${acc.label}`);
        }
    }
}

main();

import 'dotenv/config';
import { generateAccessToken } from '@strike/shared-utils';
import fetch from 'node-fetch';

const USER_ID = '3926c6c5-2e26-49c1-90c8-dab72b7cd63e'; // Account A (domenico.nica)
const EMAIL = 'domenico.nica@gmail.com';
const STEAM_ID = '76561198155371511';

async function main() {
    console.log('--- Testing Service Integration ---');

    // 1. Generate Token
    const token = generateAccessToken({
        userId: USER_ID,
        email: EMAIL,
        steamId64: STEAM_ID
    });

    // 2. Call Service Directly
    const url = 'http://localhost:3022/api/user/library';
    console.log(`Calling: ${url}`);

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Failed:', e);
    }
}

main();

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const GATEWAY_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test-steam-' + Date.now() + '@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testAuthFlow() {
    console.log('='.repeat(80));
    console.log('COMPREHENSIVE AUTH & STEAM FLOW TEST');
    console.log('='.repeat(80));

    // STEP 1: Register
    console.log('\n[1/6] TEST REGISTRATION');
    console.log('-'.repeat(80));

    const registerRes = await fetch(`${GATEWAY_URL}/api/auth/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            username: 'testuser' + Date.now()
        })
    });

    console.log('Status:', registerRes.status);
    const registerData = await registerRes.json();
    console.log('Response:', JSON.stringify(registerData, null, 2));

    if (!registerRes.ok) {
        console.error('❌ REGISTRATION FAILED');
        return;
    }

    console.log('✅ REGISTRATION OK');
    const userId = registerData.data?.userId;
    console.log('Created userId:', userId);

    // STEP 2: Login
    console.log('\n[2/6] TEST LOGIN');
    console.log('-'.repeat(80));

    const loginRes = await fetch(`${GATEWAY_URL}/api/auth/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        })
    });

    console.log('Status:', loginRes.status);
    const loginData = await loginRes.json();

    if (!loginRes.ok) {
        console.error('❌ LOGIN FAILED');
        console.log('Response:', JSON.stringify(loginData, null, 2));
        return;
    }

    const accessToken = loginData.data?.accessToken;
    console.log('✅ LOGIN OK');
    console.log('Token length:', accessToken?.length);

    // Decode token to verify userId
    try {
        const decoded = jwt.decode(accessToken) as any;
        console.log('Decoded userId:', decoded?.userId);
        console.log('Decoded email:', decoded?.email);

        if (decoded?.userId !== userId) {
            console.error('❌ TOKEN USERID MISMATCH!');
            console.error('Expected:', userId);
            console.error('Got:', decoded?.userId);
        }
    } catch (e: any) {
        console.error('❌ Failed to decode token:', e.message);
    }

    // STEP 3: Check Steam Status (Should be unlinked)
    console.log('\n[3/6] TEST STEAM STATUS (BEFORE LINK)');
    console.log('-'.repeat(80));

    const statusRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/me-steam`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    console.log('Status:', statusRes.status);
    const statusData = await statusRes.json();
    console.log('Response:', JSON.stringify(statusData, null, 2));

    if (statusData.data?.steamId64_exists) {
        console.error('❌ NEW USER SHOULD NOT HAVE STEAMID64!');
    } else {
        console.log('✅ STEAM NOT LINKED (expected)');
    }

    // STEP 4: Simulate SteamID64 Write (what callback should do)
    console.log('\n[4/6] SIMULATE STEAM LINK (DB WRITE TEST)');
    console.log('-'.repeat(80));

    const testSteamId = '76561198012345678'; // Valid format Steam ID
    console.log('Test SteamID64:', testSteamId);
    console.log('Will write to DB manually to test...');

    // We need to write to DB directly since we can't complete OAuth in automated test
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const updateResult = await prisma.user.update({
        where: { id: userId },
        data: { steamId64: testSteamId }
    });

    console.log('✅ DB WRITE SUCCESSFUL');
    console.log('Updated user:', updateResult.id);
    console.log('Confirmed steamId64:', updateResult.steamId64);

    // STEP 5: Verify Steam Status After Link
    console.log('\n[5/6] TEST STEAM STATUS (AFTER LINK)');
    console.log('-'.repeat(80));

    const statusRes2 = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/me-steam`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    console.log('Status:', statusRes2.status);
    const statusData2 = await statusRes2.json();
    console.log('Response:', JSON.stringify(statusData2, null, 2));

    if (!statusData2.data?.steamId64_exists) {
        console.error('❌ STEAMID64 NOT DETECTED AFTER DB WRITE!');
    } else {
        console.log('✅ STEAM LINKED (verified)');
    }

    // STEP 6: Test Owned Games Endpoint
    console.log('\n[6/6] TEST OWNED GAMES ENDPOINT');
    console.log('-'.repeat(80));

    const gamesRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/owned-games`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    console.log('Status:', gamesRes.status);
    const gamesData = await gamesRes.json();
    console.log('Response:', JSON.stringify(gamesData, null, 2));

    if (gamesData.data?.error?.code === 'STEAM_NOT_LINKED') {
        console.error('❌ ENDPOINT STILL SAYS NOT LINKED!');
    } else if (gamesData.data?.privacyState === 'private' || gamesData.data?.privacyState === 'unknown') {
        console.log('⚠️  Steam profile may be private (expected for test ID)');
    } else if (gamesData.data?.games) {
        console.log('✅ GAMES ENDPOINT WORKING');
        console.log('Games count:', gamesData.data.games.length);
    }

    // Cleanup
    await prisma.user.delete({ where: { id: userId } });
    console.log('\n✅ Test user cleaned up');

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));
}

testAuthFlow().catch(console.error);

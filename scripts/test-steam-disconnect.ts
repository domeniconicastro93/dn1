import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const GATEWAY_URL = 'http://localhost:3000';
const EMAIL = 'domenico.ncsnicastro@gmail.com';
const USER_ID = '6cebb0ac-5c4d-43eb-9205-d02ebecb353f';
const JWT_SECRET = 'dev-secret-key-123';
const TEST_STEAM_ID = '76561198136376383'; // Example SteamID64

async function main() {
    console.log('='.repeat(60));
    console.log('STEAM DISCONNECT & OWNED GAMES TEST');
    console.log('='.repeat(60));

    // Generate token
    const token = jwt.sign(
        { userId: USER_ID, email: EMAIL },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log('\n[1/5] INITIAL STATE CHECK');
    console.log('-'.repeat(60));
    const userBefore = await prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true }
    });
    console.log(`DB steamId64: ${userBefore?.steamId64 || 'NULL'}`);

    // Call debug endpoint
    const debugRes1 = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/me-steam`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (debugRes1.ok) {
        const debugData = await debugRes1.json();
        console.log(`Debug endpoint: ${JSON.stringify(debugData.data)}`);
    }

    console.log('\n[2/5] MANUALLY LINK STEAM ACCOUNT (simulating OAuth callback)');
    console.log('-'.repeat(60));
    await prisma.user.update({
        where: { id: USER_ID },
        data: { steamId64: TEST_STEAM_ID }
    });
    console.log(`✓ Updated DB with steamId64: ...${TEST_STEAM_ID.slice(-4)}`);

    console.log('\n[3/5] FETCH OWNED GAMES (should work now)');
    console.log('-'.repeat(60));
    const gamesRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/owned-games`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const gamesData = await gamesRes.json();
    console.log(`Status: ${gamesRes.status}`);
    console.log(`Response privacyState: ${gamesData.data?.privacyState}`);
    console.log(`Games count: ${gamesData.data?.games?.length || 0}`);
    if (gamesData.data?.error) {
        console.log(`Error: ${gamesData.data.error.code} - ${gamesData.data.error.message}`);
    }

    console.log('\n[4/5] TEST DISCONNECT');
    console.log('-'.repeat(60));
    const disconnectRes = await fetch(`${GATEWAY_URL}/api/steam/v1/disconnect`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
    console.log(`Disconnect status: ${disconnectRes.status}`);
    if (disconnectRes.ok) {
        const disconnectData = await disconnectRes.json();
        console.log(`Disconnect response: ${JSON.stringify(disconnectData)}`);
    } else {
        console.log(`Disconnect failed: ${await disconnectRes.text()}`);
    }

    // Verify DB was updated
    const userAfter = await prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true }
    });
    console.log(`DB steamId64 after disconnect: ${userAfter?.steamId64 || 'NULL'}`);

    // Call debug endpoint again
    const debugRes2 = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/me-steam`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (debugRes2.ok) {
        const debugData = await debugRes2.json();
        console.log(`Debug endpoint after disconnect: ${JSON.stringify(debugData.data)}`);
    }

    console.log('\n[5/5] VERIFY OWNED GAMES RETURNS NOT_LINKED ERROR');
    console.log('-'.repeat(60));
    const gamesRes2 = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/owned-games`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const gamesData2 = await gamesRes2.json();
    console.log(`Status: ${gamesRes2.status}`);
    console.log(`Response: ${JSON.stringify(gamesData2.data, null, 2)}`);

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));

    if (userAfter?.steamId64 === null && gamesData2.data?.error?.code === 'STEAM_NOT_LINKED') {
        console.log('✓ ALL TESTS PASSED');
    } else {
        console.log('✗ SOME TESTS FAILED');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

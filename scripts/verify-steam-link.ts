import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const GATEWAY_URL = 'http://localhost:3000';
const JWT_SECRET = 'dev-secret-key-123';
const USER_ID = '6cebb0ac-5c4d-43eb-9205-d02ebecb353f';
const EMAIL = 'domenico.ncsnicastro@gmail.com';

async function test() {
    console.log('='.repeat(80));
    console.log('STEAM LINK VERIFICATION TEST');
    console.log('='.repeat(80));

    // Generate token
    const token = jwt.sign({ userId: USER_ID, email: EMAIL }, JWT_SECRET, { expiresIn: '1h' });
    console.log('\n✅ Generated JWT token');

    console.log('\n[STEP 1] Check current DB state');
    console.log('-'.repeat(80));

    const debugRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/me-steam`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (debugRes.ok) {
        const data = await debugRes.json();
        console.log('Status:', debugRes.status);
        console.log('Current state:', JSON.stringify(data, null, 2));

        if (data.data?.steamId64_exists) {
            console.log('\n✅ SteamID64 IS LINKED in DB');
            console.log('Last 4 digits:', data.data.steamId64_last4);
        } else {
            console.log('\n⚠️  SteamID64 NOT LINKED');
        }
    } else {
        console.log('Status:', debugRes.status);
        console.log('Error:', await debugRes.text());
    }

    console.log('\n[STEP 2] Fetch owned games');
    console.log('-'.repeat(80));

    const gamesRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/owned-games`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status:', gamesRes.status);
    const gamesData = await gamesRes.json();

    if (gamesData.data?.games?.length > 0) {
        console.log('✅ SUCCESS: Found', gamesData.data.games.length, 'games');
        console.log('First 3 games:');
        gamesData.data.games.slice(0, 3).forEach((game: any) => {
            console.log('  -', game.name || game.appid);
        });
    } else if (gamesData.data?.error?.code === 'STEAM_NOT_LINKED') {
        console.log('⚠️  Error:', gamesData.data.error.message);
        console.log('\n📋 MANUAL STEPS REQUIRED:');
        console.log('1. Open browser: http://localhost:3005/games');
        console.log('2. Log in with:', EMAIL);
        console.log('3. Click "Connect Steam" button');
        console.log('4. Complete Steam authentication');
        console.log('5. Watch terminal logs for:');
        console.log('   [CONNECT steam] - Initial auth');
        console.log('   [GATEWAY CALLBACK] - Gateway receives callback');
        console.log('   [SteamCallback] - Service processes callback');
        console.log('6. Re-run this test');
    } else {
        console.log('Privacy state:', gamesData.data?.privacyState);
        console.log('Games count:', gamesData.data?.games?.length || 0);
        if (gamesData.data?.error) {
            console.log('Error:', gamesData.data.error);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));
}

test().catch(console.error);

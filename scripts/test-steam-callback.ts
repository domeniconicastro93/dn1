import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const GATEWAY_URL = 'http://localhost:3000';
const JWT_SECRET = 'dev-secret-key-123';
const USER_ID = '6cebb0ac-5c4d-43eb-9205-d02ebecb353f';
const EMAIL = 'domenico.ncsnicastro@gmail.com';

async function test() {
    console.log('='.repeat(70));
    console.log('STEAM CALLBACK & VERIFY TEST');
    console.log('='.repeat(70));

    // Generate token
    const token = jwt.sign({ userId: USER_ID, email: EMAIL }, JWT_SECRET, { expiresIn: '1h' });
    console.log('\n✅ Generated JWT token');

    // Test 1: Verify current steamId64 state
    console.log('\n[1/3] VERIFY INITIAL STATE');
    console.log('-'.repeat(70));

    const verifyRes1 = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/verify-steamid`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (verifyRes1.ok) {
        const data = await verifyRes1.json();
        console.log('Status:', verifyRes1.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } else {
        console.log('Status:', verifyRes1.status);
        console.log('Error:', await verifyRes1.text());
    }

    // Test 2: Instructions for manual Steam link
    console.log('\n[2/3] MANUAL STEAM LINK INSTRUCTIONS');
    console.log('-'.repeat(70));
    console.log('To link Steam account:');
    console.log('1. Open browser and go to: http://localhost:3005/games');
    console.log('2. Log in with:', EMAIL);
    console.log('3. Click "Connect Steam" button');
    console.log('4. Complete Steam OpenID authentication');
    console.log('5. Return here and press Enter when done...');
    console.log('\nWatch the terminal logs for callback details!');
    console.log('\nSkipping manual step in automated test...\n');

    // Test 3: Fetch owned games (will fail if not linked)
    console.log('\n[3/3] FETCH OWNED GAMES');
    console.log('-'.repeat(70));

    const gamesRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/owned-games`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status:', gamesRes.status);
    const gamesData = await gamesRes.json();
    console.log('Response:', JSON.stringify(gamesData, null, 2));

    if (gamesData.data?.games?.length > 0) {
        console.log('\n✅ SUCCESS: Found', gamesData.data.games.length, 'games');
    } else if (gamesData.data?.error?.code === 'STEAM_NOT_LINKED') {
        console.log('\n⚠️  Steam not linked - use manual instructions above');
    } else {
        console.log('\n⚠️  Unexpected response');
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));
}

test().catch(console.error);

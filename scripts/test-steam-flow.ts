
import jwt from 'jsonwebtoken';

const GATEWAY_URL = 'http://localhost:3000';
const EMAIL = 'domenico.ncsnicastro@gmail.com';
const USER_ID = '6cebb0ac-5c4d-43eb-9205-d02ebecb353f'; // From previous debug output
const JWT_SECRET = 'dev-secret-key-123'; // Default secret

async function main() {
    console.log('--- STEP 1: GENERATE TOKEN ---');
    const token = jwt.sign(
        { userId: USER_ID, email: EMAIL },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('Generated Token:', token.substring(0, 20) + '...');

    console.log('\n--- STEP 2: CHECK DEBUG ENDPOINT ---');
    const debugRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/debug/me-steam`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    // Note: Gateway might not map /api/steam/v1/steam/debug/me-steam correctly if I didn't add a proxy block for it.
    // I added proxy for /api/steam/v1/steam/owned-games.
    // I also have a catch-all /api/steam/v1 -> /api
    // So /api/steam/v1/steam/debug/me-steam -> /api/steam/debug/me-steam (via catch-all? No, catch-all is /api/steam/v1 -> /api)
    // Wait.
    // Catch-all: prefix: "/api/steam/v1", rewritePrefix: "/api"
    // Request: /api/steam/v1/steam/debug/me-steam
    // Rewritten: /api/steam/debug/me-steam
    // Service has: /api/steam/debug/me-steam
    // So it SHOULD work via catch-all.

    if (debugRes.ok) {
        const debugData = await debugRes.json();
        console.log('Debug Endpoint Response:', JSON.stringify(debugData, null, 2));
    } else {
        console.log('Debug Endpoint Failed:', debugRes.status, await debugRes.text());
    }

    console.log('\n--- STEP 3: CALL CANONICAL OWNED GAMES ---');
    const gamesRes = await fetch(`${GATEWAY_URL}/api/steam/v1/steam/owned-games`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    console.log('Status:', gamesRes.status);
    const gamesData = await gamesRes.json();
    console.log('Response:', JSON.stringify(gamesData, null, 2));
}

main().catch(console.error);

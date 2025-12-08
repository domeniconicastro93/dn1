/**
 * Test direct call to steam-library-service
 */

const http = require('http');

// First get a token by logging in
async function testDirectSteamCall() {
    console.log('='.repeat(70));
    console.log('TESTING DIRECT STEAM LIBRARY SERVICE CALL');
    console.log('='.repeat(70));

    // For this test, we need a valid token
    // Let's assume we have one from the browser
    const token = 'YOUR_TOKEN_HERE'; // User will need to paste this

    const options = {
        hostname: 'localhost',
        port: 3022,
        path: '/api/steam/owned-games',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            console.log(`\nDirect call to steam-library-service:`);
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`\nResponse Body:`);
                try {
                    const parsed = JSON.parse(data);
                    console.log(JSON.stringify(parsed, null, 2));
                } catch (e) {
                    console.log(data);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('Error:', error.message);
            reject(error);
        });

        req.end();
    });
}

console.log('NOTE: You need to paste a valid JWT token in this script');
console.log('Get it from browser DevTools > Application > Cookies > strike_access_token');
console.log('Then replace YOUR_TOKEN_HERE in this file and run again');

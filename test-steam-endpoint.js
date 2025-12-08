/**
 * Test script to debug Steam library endpoint
 * This will call the Steam API through the full stack and show what's being returned
 */

const http = require('http');

async function testSteamEndpoint() {
    console.log('='.repeat(70));
    console.log('STEAM LIBRARY DEBUG TEST');
    console.log('='.repeat(70));

    // First, we need a valid token
    // For now, let's test the endpoint directly through the gateway

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/steam/v1/owned-games',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Note: In real test, we'd need a valid Bearer token
            // For now, this will help us see if the service is responding
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            console.log(`\nStatus Code: ${res.statusCode}`);
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

testSteamEndpoint().catch(console.error);

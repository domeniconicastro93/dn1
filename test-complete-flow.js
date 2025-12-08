const http = require('http');

function request(port, path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testCompleteFlow() {
    console.log('='.repeat(70));
    console.log('STRIKE AUTHENTICATION - COMPLETE FLOW TEST');
    console.log('='.repeat(70));

    // Test 1: Auth Service Health
    console.log('\n[1/6] Testing Auth Service Health (port 3001)...');
    try {
        const res = await request(3001, '/health');
        if (res.statusCode === 200) {
            console.log('✅ Auth service is running');
        } else {
            console.log('❌ Auth service returned:', res.statusCode);
        }
    } catch (e) {
        console.log('❌ Auth service is NOT running:', e.message);
        console.log('\n⚠️  Please start auth-service:');
        console.log('   pnpm --filter @strike/auth-service run dev\n');
        return;
    }

    // Test 2: Gateway Health
    console.log('\n[2/6] Testing Gateway Health (port 3000)...');
    try {
        const res = await request(3000, '/health');
        if (res.statusCode === 200) {
            console.log('✅ Gateway is running');
        } else {
            console.log('❌ Gateway returned:', res.statusCode);
        }
    } catch (e) {
        console.log('❌ Gateway is NOT running:', e.message);
        console.log('\n⚠️  Please start gateway:');
        console.log('   pnpm --filter @strike/gateway-service run dev\n');
        return;
    }

    // Test 3: Next.js Frontend Health
    console.log('\n[3/6] Testing Next.js Frontend (port 3005)...');
    try {
        const res = await request(3005, '/api/health');
        if (res.statusCode === 200 || res.statusCode === 404) {
            console.log('✅ Next.js is running');
        } else {
            console.log('⚠️  Next.js returned:', res.statusCode);
        }
    } catch (e) {
        console.log('❌ Next.js is NOT running:', e.message);
        console.log('\n⚠️  Please start Next.js:');
        console.log('   pnpm --filter @strike/web run dev\n');
    }

    // Test 4: Session endpoint (Direct to Auth Service)
    console.log('\n[4/6] Testing Session Endpoint (Direct - Auth Service)...');
    try {
        const res = await request(3001, '/api/auth/v1/session');
        console.log('Status:', res.statusCode);
        const data = JSON.parse(res.body);

        if (res.statusCode === 200) {
            if (data.data && data.data.authenticated === false) {
                console.log('✅ Session endpoint working correctly (unauthenticated)');
            } else if (data.data && data.data.authenticated === true) {
                console.log('✅ Session endpoint working (authenticated)');
                console.log('   User:', data.data.user?.email);
            } else {
                console.log('⚠️  Unexpected response format:', JSON.stringify(data, null, 2));
            }
        } else if (res.statusCode === 500) {
            console.log('❌ Session endpoint returning 500 error');
            console.log('   This means auth-service needs to be restarted!');
            console.log('\n⚠️  SOLUTION:');
            console.log('   1. Stop auth-service (Ctrl+C)');
            console.log('   2. Run: pnpm --filter @strike/auth-service run dev\n');
        } else {
            console.log('⚠️  Unexpected status:', res.statusCode);
            console.log('   Body:', res.body);
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test 5: Session endpoint (Via Gateway)
    console.log('\n[5/6] Testing Session Endpoint (Via Gateway)...');
    try {
        const res = await request(3000, '/api/auth/v1/session');
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
            const data = JSON.parse(res.body);
            if (data.data && data.data.authenticated === false) {
                console.log('✅ Gateway → Auth service working (unauthenticated)');
            } else if (data.data && data.data.authenticated === true) {
                console.log('✅ Gateway → Auth service working (authenticated)');
            }
        } else if (res.statusCode === 500) {
            console.log('❌ Gateway returning 500 - auth-service needs restart');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test 6: Session endpoint (Via Next.js API)
    console.log('\n[6/6] Testing Session Endpoint (Via Next.js /api/auth/session)...');
    try {
        const res = await request(3005, '/api/auth/session');
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
            const data = JSON.parse(res.body);
            console.log('Response:', JSON.stringify(data, null, 2));

            if (data.authenticated === true) {
                console.log('✅ Frontend session working! User should see profile in header');
                console.log('   User:', data.user?.email);
            } else {
                console.log('⚠️  User not authenticated in frontend');
                console.log('   This is why "Login / Register" is showing instead of avatar');
            }
        } else {
            console.log('⚠️  Unexpected status:', res.statusCode);
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('\nIf you see "Session endpoint returning 500 error":');
    console.log('  → Restart auth-service: pnpm --filter @strike/auth-service run dev');
    console.log('\nIf session works but frontend shows "Login / Register":');
    console.log('  → Check browser cookies in DevTools');
    console.log('  → Try logging out and logging in again');
    console.log('='.repeat(70));
}

testCompleteFlow();

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

async function testCookieFlow() {
    console.log('='.repeat(70));
    console.log('COOKIE FLOW TEST - DEBUGGING LOGIN');
    console.log('='.repeat(70));

    // Test 1: Login and check for Set-Cookie header
    console.log('\n[TEST 1] Login via Next.js /api/auth/login');
    console.log('-'.repeat(70));

    try {
        const loginRes = await request(3005, '/api/auth/login', 'POST', {
            email: 'domenico.nica@gmail.com',
            password: 'Domenico1996!' // Update with actual password
        });

        console.log('Status:', loginRes.statusCode);
        console.log('Body:', loginRes.body);

        // Check for Set-Cookie header
        const setCookieHeader = loginRes.headers['set-cookie'];
        console.log('\nSet-Cookie header:', setCookieHeader);

        if (setCookieHeader) {
            console.log('✅ Set-Cookie header is present!');

            // Parse cookies
            const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
            const accessTokenCookie = cookies.find(c => c.includes('strike_access_token'));
            const refreshTokenCookie = cookies.find(c => c.includes('strike_refresh_token'));

            if (accessTokenCookie) {
                console.log('✅ strike_access_token cookie found');
                console.log('   Cookie:', accessTokenCookie.substring(0, 100) + '...');

                // Extract token value
                const tokenMatch = accessTokenCookie.match(/strike_access_token=([^;]+)/);
                if (tokenMatch) {
                    const token = tokenMatch[1];
                    console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');

                    // Test 2: Use the cookie in a session request
                    console.log('\n[TEST 2] Session check with cookie');
                    console.log('-'.repeat(70));

                    const sessionRes = await request(3005, '/api/auth/session', 'GET', null, {
                        'Cookie': `strike_access_token=${token}`
                    });

                    console.log('Status:', sessionRes.statusCode);
                    const sessionData = JSON.parse(sessionRes.body);
                    console.log('Response:', JSON.stringify(sessionData, null, 2));

                    if (sessionData.authenticated) {
                        console.log('✅ SUCCESS! Session is authenticated with cookie!');
                        console.log('   User:', sessionData.user?.email);
                    } else {
                        console.log('❌ FAIL: Session is NOT authenticated even with cookie');
                        console.log('   This means the cookie is not being read correctly');
                    }
                }
            } else {
                console.log('❌ strike_access_token cookie NOT found in Set-Cookie header');
            }

            if (refreshTokenCookie) {
                console.log('✅ strike_refresh_token cookie found');
            }
        } else {
            console.log('❌ CRITICAL: No Set-Cookie header in login response!');
            console.log('   This means the login API route is not setting cookies');
            console.log('   Check if Next.js dev server needs to be restarted');
        }

        // Test 3: Check if login was successful
        const loginData = JSON.parse(loginRes.body);
        if (loginData.success) {
            console.log('\n✅ Login API returned success: true');
        } else {
            console.log('\n❌ Login API returned success: false');
            console.log('   Error:', loginData.error);
        }

    } catch (e) {
        console.log('❌ Error during login:', e.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('DIAGNOSIS');
    console.log('='.repeat(70));
    console.log('\nIf Set-Cookie header is missing:');
    console.log('  → Next.js dev server needs to be restarted');
    console.log('  → Run: pnpm --filter @strike/web run dev');
    console.log('\nIf Set-Cookie is present but session is not authenticated:');
    console.log('  → Cookie is not being sent by browser');
    console.log('  → Check browser DevTools → Application → Cookies');
    console.log('\nIf login returns success: false:');
    console.log('  → Update email/password in this test script');
    console.log('='.repeat(70));
}

testCookieFlow();

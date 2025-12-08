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

async function testLoginFlow() {
    console.log('='.repeat(70));
    console.log('COMPLETE LOGIN FLOW TEST');
    console.log('='.repeat(70));

    // Test 1: Login via Next.js API
    console.log('\n[1/4] Testing Login via Next.js /api/auth/login...');
    try {
        const loginRes = await request(3005, '/api/auth/login', 'POST', {
            email: 'domenico.nica@gmail.com',
            password: 'test123' // Replace with actual password
        });

        console.log('Status:', loginRes.statusCode);

        if (loginRes.statusCode === 200) {
            const data = JSON.parse(loginRes.body);
            console.log('Response:', JSON.stringify(data, null, 2));

            if (data.success) {
                console.log('✅ Login successful!');

                // Check if Set-Cookie header is present
                if (loginRes.headers['set-cookie']) {
                    console.log('✅ Set-Cookie header found:');
                    console.log(loginRes.headers['set-cookie']);
                } else {
                    console.log('❌ WARNING: No Set-Cookie header in response!');
                    console.log('   This means cookies are not being set by Next.js');
                }
            } else {
                console.log('❌ Login failed:', data.error || 'Unknown error');
                console.log('\n⚠️  Please update the email/password in this script');
                return;
            }
        } else {
            console.log('❌ Login failed with status:', loginRes.statusCode);
            console.log('Response:', loginRes.body);
            console.log('\n⚠️  Please update the email/password in this script');
            return;
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
        return;
    }

    // Test 2: Check session immediately after login
    console.log('\n[2/4] Testing Session via Next.js /api/auth/session (no cookie)...');
    try {
        const sessionRes = await request(3005, '/api/auth/session');
        console.log('Status:', sessionRes.statusCode);
        const data = JSON.parse(sessionRes.body);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.authenticated) {
            console.log('✅ Session shows authenticated (cookies working!)');
        } else {
            console.log('❌ Session shows NOT authenticated');
            console.log('   This is the BUG - cookies are not being sent/received');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test 3: Check auth-service directly
    console.log('\n[3/4] Testing Auth Service /api/auth/v1/session (no cookie)...');
    try {
        const authRes = await request(3001, '/api/auth/v1/session');
        console.log('Status:', authRes.statusCode);
        const data = JSON.parse(authRes.body);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test 4: Check Gateway
    console.log('\n[4/4] Testing Gateway /api/auth/v1/session (no cookie)...');
    try {
        const gwRes = await request(3000, '/api/auth/v1/session');
        console.log('Status:', gwRes.statusCode);
        const data = JSON.parse(gwRes.body);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('DIAGNOSIS');
    console.log('='.repeat(70));
    console.log('\nIf login succeeds but session shows NOT authenticated:');
    console.log('  → The problem is that Next.js is NOT setting cookies');
    console.log('  → Check apps/web/lib/server/auth-actions.ts setAccessToken()');
    console.log('  → Check apps/web/lib/server/strike-auth.ts');
    console.log('\nIf Set-Cookie header is missing:');
    console.log('  → Next.js API route is not calling setAccessToken correctly');
    console.log('  → Or setAccessToken is not using cookies() from next/headers');
    console.log('='.repeat(70));
}

testLoginFlow();

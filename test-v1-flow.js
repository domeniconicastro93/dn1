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

async function testV1Flow() {
    console.log('='.repeat(70));
    console.log('TESTING NEW V1 ENDPOINTS');
    console.log('='.repeat(70));

    // Test 1: Login via /api/auth/v1/login
    console.log('\n[1/3] Testing Login via /api/auth/v1/login...');
    try {
        const loginRes = await request(3005, '/api/auth/v1/login', 'POST', {
            email: 'domenico.nica@gmail.com',
            password: 'Domenico1996!' // Update if needed
        });

        console.log('Status:', loginRes.statusCode);

        if (loginRes.statusCode === 200) {
            const data = JSON.parse(loginRes.body);
            console.log('Response:', JSON.stringify(data, null, 2));

            if (data.success) {
                console.log('✅ Login successful!');

                const setCookieHeader = loginRes.headers['set-cookie'];
                if (setCookieHeader) {
                    console.log('✅ Set-Cookie header found');

                    // Extract cookie for session test
                    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                    const accessTokenCookie = cookies.find(c => c.includes('strike_access_token'));

                    if (accessTokenCookie) {
                        const token = accessTokenCookie.split(';')[0];

                        // Test 2: Session via /api/auth/v1/session
                        console.log('\n[2/3] Testing Session via /api/auth/v1/session...');
                        const sessionRes = await request(3005, '/api/auth/v1/session', 'GET', null, {
                            'Cookie': token
                        });

                        console.log('Status:', sessionRes.statusCode);
                        const sessionData = JSON.parse(sessionRes.body);
                        console.log('Response:', JSON.stringify(sessionData, null, 2));

                        if (sessionData.authenticated) {
                            console.log('✅ Session authenticated!');
                        } else {
                            console.log('❌ Session NOT authenticated');
                        }
                    }
                } else {
                    console.log('❌ No Set-Cookie header');
                }
            }
        } else {
            console.log('❌ Login failed with status:', loginRes.statusCode);
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }
}

testV1Flow();

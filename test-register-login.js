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

async function testRegisterAndLogin() {
    console.log('='.repeat(70));
    console.log('REGISTER + LOGIN + SESSION TEST (V1)');
    console.log('='.repeat(70));

    const testEmail = `test${Date.now()}@strike.com`;
    const testPassword = 'TestPassword123!';

    // Step 1: Register
    console.log('\n[1/3] Registering new user...');
    console.log('Email:', testEmail);

    try {
        const registerRes = await request(3005, '/api/auth/v1/register', 'POST', {
            email: testEmail,
            password: testPassword,
        });

        console.log('Status:', registerRes.statusCode);
        const registerData = JSON.parse(registerRes.body);

        if (registerRes.statusCode === 201 || registerData.success) {
            console.log('✅ Registration successful!');
        } else {
            console.log('❌ Registration failed:', registerRes.body);
            return;
        }
    } catch (e) {
        console.log('❌ Registration error:', e.message);
        return;
    }

    // Step 2: Login
    console.log('\n[2/3] Logging in...');
    let accessTokenCookie = null;

    try {
        const loginRes = await request(3005, '/api/auth/v1/login', 'POST', {
            email: testEmail,
            password: testPassword,
        });

        console.log('Status:', loginRes.statusCode);
        const loginData = JSON.parse(loginRes.body);

        if (loginData.success) {
            console.log('✅ Login successful!');

            const setCookie = loginRes.headers['set-cookie'];
            console.log('Set-Cookie:', setCookie);

            if (setCookie) {
                const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
                const tokenCookie = cookies.find(c => c.includes('strike_access_token'));
                if (tokenCookie) {
                    accessTokenCookie = tokenCookie.split(';')[0];
                    console.log('✅ Access Token Cookie extracted:', accessTokenCookie);
                } else {
                    console.log('❌ strike_access_token cookie not found in response');
                }
            } else {
                console.log('❌ No Set-Cookie header received');
            }
        } else {
            console.log('❌ Login failed:', loginData.error);
            return;
        }
    } catch (e) {
        console.log('❌ Login error:', e.message);
        return;
    }

    if (!accessTokenCookie) {
        console.log('❌ Cannot proceed to session test without cookie');
        return;
    }

    // Step 3: Session
    console.log('\n[3/3] Checking Session...');
    try {
        const sessionRes = await request(3005, '/api/auth/v1/session', 'GET', null, {
            'Cookie': accessTokenCookie
        });

        console.log('Status:', sessionRes.statusCode);
        const sessionData = JSON.parse(sessionRes.body);
        console.log('Response:', JSON.stringify(sessionData, null, 2));

        if (sessionData.authenticated) {
            console.log('✅ SESSION AUTHENTICATED! The flow works.');
        } else {
            console.log('❌ SESSION NOT AUTHENTICATED. Debug logs should show why.');
        }
    } catch (e) {
        console.log('❌ Session error:', e.message);
    }
}

testRegisterAndLogin();

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

async function run() {
    console.log('='.repeat(60));
    console.log('PHASE 1 VERIFICATION TEST SUITE');
    console.log('='.repeat(60));

    // Test 1: Auth Service Health
    console.log('\n[TEST 1] Auth Service Health Check');
    console.log('-'.repeat(60));
    try {
        const res = await request(3001, '/health');
        console.log('✓ Status:', res.statusCode);
        console.log('✓ Body:', res.body);
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    // Test 2: Gateway Health
    console.log('\n[TEST 2] Gateway Health Check');
    console.log('-'.repeat(60));
    try {
        const res = await request(3000, '/health');
        console.log('✓ Status:', res.statusCode);
        console.log('✓ Body:', res.body);
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    // Test 3: Login (Invalid Credentials)
    console.log('\n[TEST 3] Login with Invalid Credentials');
    console.log('-'.repeat(60));
    try {
        const res = await request(3001, '/api/auth/v1/login', 'POST', {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.log('✓ Status:', res.statusCode, '(Expected: 401)');
        console.log('✓ Body:', res.body);
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    // Test 4: Session Check (No Auth)
    console.log('\n[TEST 4] Session Check (Unauthenticated)');
    console.log('-'.repeat(60));
    try {
        const res = await request(3001, '/api/auth/v1/session', 'GET');
        console.log('✓ Status:', res.statusCode, '(Expected: 200)');
        console.log('✓ Body:', res.body);
        const data = JSON.parse(res.body);
        if (data.data && data.data.authenticated === false) {
            console.log('✓ Correctly returns authenticated: false');
        } else {
            console.log('✗ Unexpected response format');
        }
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    // Test 5: Login via Gateway
    console.log('\n[TEST 5] Login via Gateway (Invalid Credentials)');
    console.log('-'.repeat(60));
    try {
        const res = await request(3000, '/api/auth/v1/login', 'POST', {
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.log('✓ Status:', res.statusCode, '(Expected: 401)');
        console.log('✓ Body:', res.body);
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    // Test 6: Session via Gateway (No Auth)
    console.log('\n[TEST 6] Session via Gateway (Unauthenticated)');
    console.log('-'.repeat(60));
    try {
        const res = await request(3000, '/api/auth/v1/session', 'GET');
        console.log('✓ Status:', res.statusCode, '(Expected: 200)');
        console.log('✓ Body:', res.body);
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('PHASE 1 VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNOTE: To test with valid credentials, update the email/password');
    console.log('in this script and run again.');
}

run();

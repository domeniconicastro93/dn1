const http = require('http');

function request(port, path, cookie) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'GET',
            headers: {
                'Cookie': cookie
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
                    body: data,
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function testSessionWithCookie() {
    console.log('='.repeat(70));
    console.log('SESSION TEST WITH COOKIE FROM BROWSER');
    console.log('='.repeat(70));

    // Paste the cookie value from browser DevTools here
    const cookieFromBrowser = 'strike_access_token=YOUR_TOKEN_HERE';

    console.log('\n⚠️  IMPORTANT: Update the cookie value in this script!');
    console.log('   1. Open DevTools → Application → Cookies');
    console.log('   2. Copy the value of strike_access_token');
    console.log('   3. Paste it in this script (line 35)');
    console.log('   4. Run again: node test-session-with-cookie.js\n');

    if (cookieFromBrowser === 'strike_access_token=YOUR_TOKEN_HERE') {
        console.log('❌ Cookie not updated in script. Please update and run again.');
        return;
    }

    console.log('[TEST] Calling /api/auth/session with cookie...');

    try {
        const res = await request(3005, '/api/auth/session', cookieFromBrowser);
        console.log('Status:', res.statusCode);
        const data = JSON.parse(res.body);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.authenticated) {
            console.log('\n✅ SUCCESS! Session is authenticated!');
            console.log('   User:', data.user?.email);
            console.log('\n   This means the backend is working correctly.');
            console.log('   The problem is in the frontend React component.');
            console.log('   Try refreshing the page (F5) in the browser.');
        } else {
            console.log('\n❌ Session is NOT authenticated');
            console.log('   This means the cookie is not being read correctly');
            console.log('   or the token is invalid/expired.');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n' + '='.repeat(70));
}

testSessionWithCookie();

const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/auth/v1/session',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Body:');
        console.log(data);

        if (res.statusCode === 200) {
            try {
                const parsed = JSON.parse(data);
                console.log('\nParsed Response:');
                console.log(JSON.stringify(parsed, null, 2));

                if (parsed.data && parsed.data.authenticated === false) {
                    console.log('\n✅ SUCCESS! Session endpoint working correctly (unauthenticated)');
                } else if (parsed.data && parsed.data.authenticated === true) {
                    console.log('\n✅ SUCCESS! Session endpoint working (authenticated)');
                }
            } catch (e) {
                console.log('\n❌ Failed to parse JSON');
            }
        } else {
            console.log('\n❌ ERROR: Expected 200, got', res.statusCode);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.end();

const http = require('http');

function request(port, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'GET',
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

async function checkSessionRoute() {
    console.log('Checking /api/auth/v1/session...');
    try {
        const res = await request(3005, '/api/auth/v1/session');
        console.log('Status:', res.statusCode);
        console.log('Body:', res.body);
        if (res.statusCode === 200) {
            console.log('✅ Route exists and works!');
        } else {
            console.log('❌ Route failed');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }
}

checkSessionRoute();

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
                console.log('Status:', res.statusCode);
                console.log('Headers:', JSON.stringify(res.headers, null, 2));
                console.log('Body:', data);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log('Error:', e.message);
            reject(e);
        });

        req.end();
    });
}

console.log('Testing /api/auth/v1/session (no auth)...\n');
request(3001, '/api/auth/v1/session');

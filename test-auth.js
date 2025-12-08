const http = require('http');

function request(port, path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
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
    console.log('--- Testing Auth Service (3001) Health ---');
    try {
        const res = await request(3001, '/health');
        console.log('Status:', res.statusCode);
        console.log('Body:', res.body);
    } catch (e) {
        console.log('Error:', e.message);
    }

    console.log('\n--- Testing Gateway (3000) Health ---');
    try {
        const res = await request(3000, '/health');
        console.log('Status:', res.statusCode);
        console.log('Body:', res.body);
    } catch (e) {
        console.log('Error:', e.message);
    }

    console.log('\n--- Testing Login Direct (3001) ---');
    try {
        const res = await request(3001, '/api/auth/v1/login', 'POST', {
            email: 'domenico.nica@gmail.com',
            password: 'wrongpassword' // Expecting 401 Invalid Credentials
        });
        console.log('Status:', res.statusCode);
        console.log('Body:', res.body);
    } catch (e) {
        console.log('Error:', e.message);
    }
}

run();

import fetch from 'node-fetch';

async function main() {
    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3001/api/auth/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'domenico.nica@gmail.com',
            password: 'Nosmoking93!!'
        })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('Got token:', token);

    // 2. Call start-session endpoint on Next.js server
    console.log('Calling start-session...');
    const startSessionRes = await fetch('http://localhost:3005/api/compute/start-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `strike_access_token=${token}`
        },
        body: JSON.stringify({
            appId: '1515950' // Capcom Arcade Stadium
        })
    });

    console.log('Status:', startSessionRes.status);
    const text = await startSessionRes.text();
    console.log('Response:', text);
}

main().catch(console.error);

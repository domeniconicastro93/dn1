import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const token = jwt.sign(
    { userId: '6cebb0ac-5c4d-43eb-9205-d02ebecb353f', email: 'domenico.ncsnicastro@gmail.com' },
    'dev-secret-key-123',
    { expiresIn: '1h' }
);

async function test() {
    console.log('Testing Auth Service Disconnect Directly');
    console.log('Token:', token.substring(0, 20) + '...');

    const res = await fetch('http://localhost:3001/api/auth/v1/steam/disconnect', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    console.log('Status:', res.status);
    console.log('Response:', await res.text());
}

test().catch(console.error);

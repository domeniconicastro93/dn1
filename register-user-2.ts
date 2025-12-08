import fetch from 'node-fetch';

async function register() {
    const res = await fetch('http://localhost:3001/api/auth/v1/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'domenico.ncsnicastro@gmail.com',
            password: 'Nosmoking93!!',
            locale: 'it',
            marketingConsent: false
        })
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
}

register();

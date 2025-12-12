import https from 'https';

async function completePairing() {
    const APOLLO_HOST = '20.31.130.73';
    const PIN = '4795';
    const OTP = 'strike1234';

    console.log('');
    console.log('🔐 Completing pairing with PIN:', PIN);
    console.log('🆔 OTP/Client ID:', OTP);
    console.log('');

    try {
        const bodyData = JSON.stringify({
            pin: PIN,
            otp: OTP,
        });

        const options = {
            hostname: APOLLO_HOST,
            port: 47990,
            path: '/api/pin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyData),
            },
            rejectUnauthorized: false,
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📡 Response status:', res.statusCode);
                console.log('📄 Response body:', data);
                console.log('');

                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('========================================');
                    console.log('🎉 PAIRING SUCCESSFUL!');
                    console.log('========================================');
                    console.log('');
                    console.log('✅ Client "strike1234" is now paired!');
                    console.log('');
                } else {
                    console.log('❌ Pairing failed');
                    console.log('');
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
        });

        req.write(bodyData);
        req.end();

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

completePairing();

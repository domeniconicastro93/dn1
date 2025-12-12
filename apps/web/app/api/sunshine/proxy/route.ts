import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const host = searchParams.get('host');
        const port = searchParams.get('port');
        const useHttps = searchParams.get('useHttps') === 'true';

        if (!host || !port) {
            return NextResponse.json({ error: 'Missing host or port' }, { status: 400 });
        }

        console.log('[Sunshine Proxy] Fetching:', `${useHttps ? 'https' : 'http'}://${host}:${port}`);

        // Use https.request for better SSL control
        return new Promise<NextResponse>((resolve) => {
            const options = {
                hostname: host,
                port: parseInt(port, 10),
                path: '/',
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from('strike:Nosmoking93!!').toString('base64'),
                },
                rejectUnauthorized: false, // Accept self-signed certificates
            };

            const protocol = useHttps ? https : http;
            const req = protocol.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('[Sunshine Proxy] Success, status:', res.statusCode);

                    resolve(new NextResponse(data, {
                        status: res.statusCode || 200,
                        headers: {
                            'Content-Type': res.headers['content-type'] || 'text/html',
                            'Access-Control-Allow-Origin': '*',
                        },
                    }));
                });
            });

            req.on('error', (error) => {
                console.error('[Sunshine Proxy] Error:', error.message);
                resolve(NextResponse.json(
                    { error: 'Failed to connect to Sunshine', details: error.message },
                    { status: 500 }
                ));
            });

            req.setTimeout(10000, () => {
                console.error('[Sunshine Proxy] Timeout');
                req.destroy();
                resolve(NextResponse.json(
                    { error: 'Connection timeout' },
                    { status: 504 }
                ));
            });

            req.end();
        });
    } catch (error: any) {
        console.error('[Sunshine Proxy] Exception:', error.message);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

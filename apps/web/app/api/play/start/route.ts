import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/strike-auth';

export async function POST(request: NextRequest) {
    try {
        console.log('[Play Start API] === START ===');

        const token = await getAccessToken();
        if (!token) {
            console.log('[Play Start API] No token found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[Play Start API] Request body:', body);

        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${gatewayUrl}/api/play/start`;

        console.log('[Play Start API] Calling gateway:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        console.log('[Play Start API] Gateway response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Play Start API] Gateway error:', errorText);
            return NextResponse.json(
                { error: 'Failed to start session', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Play Start API] Success:', data);
        console.log('[Play Start API] === END ===');

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Play Start API] EXCEPTION:', error.message);
        console.error('[Play Start API] Stack:', error.stack);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

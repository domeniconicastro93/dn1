import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/strike-auth';

export async function POST(request: NextRequest) {
    try {
        console.log('[Play Stop API] === START ===');

        const token = await getAccessToken();
        if (!token) {
            console.log('[Play Stop API] No token found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[Play Stop API] Request body:', body);

        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${gatewayUrl}/api/play/stop`;

        console.log('[Play Stop API] Calling gateway:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        console.log('[Play Stop API] Gateway response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Play Stop API] Gateway error:', errorText);
            return NextResponse.json(
                { error: 'Failed to stop session', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Play Stop API] Success');
        console.log('[Play Stop API] === END ===');

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Play Stop API] EXCEPTION:', error.message);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

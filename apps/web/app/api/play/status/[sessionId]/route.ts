import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/strike-auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        console.log('[Play Status API] === START ===');
        console.log('[Play Status API] Session ID:', params.sessionId);

        const token = await getAccessToken();
        if (!token) {
            console.log('[Play Status API] No token found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${gatewayUrl}/api/play/status/${params.sessionId}`;

        console.log('[Play Status API] Calling gateway:', targetUrl);

        const response = await fetch(targetUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        console.log('[Play Status API] Gateway response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Play Status API] Gateway error:', errorText);
            return NextResponse.json(
                { error: 'Failed to get session status', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Play Status API] Success');
        console.log('[Play Status API] === END ===');

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Play Status API] EXCEPTION:', error.message);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

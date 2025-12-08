import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/strike-auth';

export async function GET(request: NextRequest) {
    try {
        console.log('[Steam API Route] === START ===');
        const token = await getAccessToken();

        if (!token) {
            console.log('[Steam API Route] No token found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${gatewayUrl}/api/steam/v1/owned-games`;

        console.log('[Steam API Route] Calling gateway:', targetUrl);

        // CORRECT ENDPOINT via Gateway: /api/steam/v1/owned-games
        // Gateway maps /api/steam/v1/owned-games -> Service /api/steam/owned-games
        const response = await fetch(targetUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            cache: 'no-store',
        });

        console.log('[Steam API Route] Gateway response status:', response.status);

        if (!response.ok) {
            console.error('[Steam API Route] Failed to fetch Steam games:', response.status);
            const errorText = await response.text();
            console.error('[Steam API Route] Error response:', errorText);
            return NextResponse.json(
                { ownedGames: [], totalCount: 0, privacyState: 'unknown' },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Steam API Route] Raw gateway response:', JSON.stringify(data, null, 2));

        const result = data.data || data;
        console.log('[Steam API Route] Extracted result:', JSON.stringify(result, null, 2));
        console.log('[Steam API Route] result.games:', result.games?.length || 0, 'games');
        console.log('[Steam API Route] result.privacyState:', result.privacyState);

        const finalResponse = {
            ownedGames: result.games || [],
            totalCount: (result.games || []).length,
            privacyState: result.privacyState || 'unknown',
        };

        console.log('[Steam API Route] Final response:', JSON.stringify(finalResponse, null, 2));
        console.log('[Steam API Route] === END ===');

        return NextResponse.json(finalResponse);
    } catch (error: any) {
        console.error('[Steam API Route] EXCEPTION:', error.message);
        console.error('[Steam API Route] Stack:', error.stack);
        return NextResponse.json(
            { ownedGames: [], totalCount: 0, privacyState: 'unknown' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/steam/disconnect
 * Disconnects the user's Steam account by clearing the steamId64 from the database
 */
export async function POST(req: NextRequest) {
    try {
        // Get the user's access token from cookies
        const cookieStore = cookies();
        const accessToken = cookieStore.get('strike_access_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }


        // Call Gateway to disconnect Steam (which forwards to Auth Service)
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${gatewayUrl}/api/steam/v1/disconnect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { success: false, error: errorData.error || 'Failed to disconnect Steam' },
                { status: response.status }
            );
        }

        const data = await response.json();

        const res = NextResponse.json({
            success: true,
            message: 'Steam account disconnected successfully',
        });

        // Clear the local steam link cookie
        res.cookies.delete('strike_steam_link');

        return res;
    } catch (error) {
        console.error('[Steam Disconnect API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

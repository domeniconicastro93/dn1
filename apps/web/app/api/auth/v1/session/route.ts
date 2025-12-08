import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { UserDTO } from '@strike/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET() {
  console.log('🔍 [SESSION API] Request received at /api/auth/v1/session');

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strike_access_token')?.value;

    console.log(`🔍 [SESSION API] Access Token present: ${!!accessToken}`);
    if (accessToken) {
      console.log(`🔍 [SESSION API] Token starts with: ${accessToken.substring(0, 10)}...`);
    } else {
      console.log('❌ [SESSION API] No access token found in cookies');
      // Log all available cookies for debugging
      const allCookies = cookieStore.getAll().map(c => c.name).join(', ');
      console.log(`🔍 [SESSION API] Available cookies: ${allCookies}`);

      return NextResponse.json({
        authenticated: false,
        user: null,
        roles: [],
        debug: 'No token found'
      });
    }

    // Call auth service
    console.log(`🔍 [SESSION API] Calling Auth Service: ${API_BASE_URL}/api/auth/v1/session`);

    const response = await fetch(`${API_BASE_URL}/api/auth/v1/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        // Forward the cookie just in case the backend expects it directly
        'Cookie': `strike_access_token=${accessToken}`
      },
      cache: 'no-store',
    });

    console.log(`🔍 [SESSION API] Auth Service Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [SESSION API] Auth Service error: ${response.status}`);
      return NextResponse.json({
        authenticated: false,
        user: null,
        roles: [],
        debug: `Auth service error ${response.status}`
      });
    }

    const data = await response.json();
    console.log(`🔍 [SESSION API] Auth Service Data:`, JSON.stringify(data).substring(0, 200));

    // Auth service returns { success: true, data: { authenticated: true, user: ... } }
    const result = data.data;

    if (!result || !result.authenticated || !result.user) {
      console.log('❌ [SESSION API] User not authenticated in response data');
      return NextResponse.json({
        authenticated: false,
        user: null,
        roles: [],
        debug: 'Not authenticated in response'
      });
    }

    console.log(`✅ [SESSION API] User authenticated: ${result.user.email}`);

    return NextResponse.json({
      authenticated: true,
      user: result.user,
      roles: [],
    });

  } catch (error) {
    console.error('❌ [SESSION API] Critical Error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      roles: [],
      debug: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

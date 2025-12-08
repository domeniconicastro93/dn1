import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 
 * Clears authentication cookies.
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear all auth cookies
    response.cookies.delete('strike_access_token');
    response.cookies.delete('strike_refresh_token');
    response.cookies.delete('strike_user_id');

    return response;
  } catch (error) {
    console.error('[LOGOUT API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      },
      { status: 500 }
    );
  }
}

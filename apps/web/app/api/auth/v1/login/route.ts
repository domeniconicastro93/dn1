import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * POST /api/auth/login
 * 
 * Handles user login and sets cookies in the response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call auth service via gateway
    const endpoint = `${API_BASE_URL}/api/auth/v1/login`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Login failed' },
        { status: response.status }
      );
    }

    // Extract tokens from response
    const result = data.data;
    if (!result || !result.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid response from auth service' },
        { status: 500 }
      );
    }

    // Create response with cookies
    const successResponse = NextResponse.json({ success: true });

    // Set access token cookie
    successResponse.cookies.set('strike_access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    // Set refresh token cookie
    if (result.refreshToken) {
      successResponse.cookies.set('strike_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return successResponse;
  } catch (error) {
    console.error('[LOGIN API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    );
  }
}

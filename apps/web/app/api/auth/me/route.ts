import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/strike-auth';
import type { UserDTO } from '@strike/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * GET /api/auth/me
 * 
 * Fetches the current user's profile using the JWT token from cookie.
 * Returns null if not authenticated.
 */
export async function GET() {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      return NextResponse.json({ user: null });
    }

    // Fetch user profile from user-service
    const response = await fetch(`${API_BASE_URL}/api/user/v1/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Token might be expired or invalid
      if (response.status === 401) {
        return NextResponse.json({ user: null });
      }
      throw new Error(`User service returned ${response.status}`);
    }

    const data = await response.json();
    const user = data.data as UserDTO;

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ user: null });
  }
}


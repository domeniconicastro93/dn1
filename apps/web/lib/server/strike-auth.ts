import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { UserDTO } from '@strike/shared-types';

interface JWTPayload {
  userId: string;
  email: string;
  steamId64?: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';
console.log('[AUTH] JWT_SECRET length:', JWT_SECRET.length);
console.log('[AUTH] JWT_SECRET first 5 chars:', JWT_SECRET.substring(0, 5));
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface StrikeSession {
  userId: string;
  steamId64?: string;
}

export interface StrikeSessionWithProfile extends StrikeSession {
  user: UserDTO;
  roles: string[];
}

const STRIKE_USER_COOKIE = 'strike_user_id';
const ACCESS_TOKEN_COOKIE = 'strike_access_token';
const REFRESH_TOKEN_COOKIE = 'strike_refresh_token';

/**
 * Get access token from cookie
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map(c => c.name).join(', ');
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

/**
 * Set access token in cookie
 */
export async function setAccessToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes (matches JWT_EXPIRES_IN)
  });
}

/**
 * Set refresh token in cookie
 */
export async function setRefreshToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches JWT_REFRESH_EXPIRES_IN)
  });
}

/**
 * Clear all auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(STRIKE_USER_COOKIE);
}

/**
 * Get Strike session from JWT token or fallback to demo cookie
 * Backward compatible with existing demo mode
 */
export async function getStrikeSession(): Promise<StrikeSession | null> {
  const cookieStore = await cookies();

  // Try to get userId from JWT token first
  const accessToken = await getAccessToken();
  console.log('[AUTH] getStrikeSession - Access Token present:', !!accessToken);

  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, JWT_SECRET) as JWTPayload;
      return { userId: payload.userId, steamId64: payload.steamId64 };
    } catch (err) {
      console.error('[AUTH] getStrikeSession - Token verification failed:', err);
      if (err instanceof Error) {
        console.error('[AUTH] Error name:', err.name);
        console.error('[AUTH] Error message:', err.message);
      }
      // Token invalid or expired, fall through to demo mode
    }
  } else {
    console.log('[AUTH] getStrikeSession - No access token found');
  }

  // Fallback to demo cookie/ENV (backward compatibility)
  const userId =
    cookieStore.get(STRIKE_USER_COOKIE)?.value || process.env.STRIKE_DEMO_USER_ID;
  if (!userId) {
    console.log('[AUTH] getStrikeSession - No fallback user ID found');
    return null;
  }
  return { userId };
}

/**
 * Get Strike session with full user profile and roles
 * This function fetches the complete user profile from user-service
 * Use this when you need full user data (email, displayName, etc.)
 */
export async function getStrikeSessionWithProfile(): Promise<StrikeSessionWithProfile | null> {
  const session = await getStrikeSession();

  if (!session) {
    return null;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
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
      if (response.status === 401) {
        return null; // Token expired or invalid
      }
      throw new Error(`User service returned ${response.status}`);
    }

    const data = await response.json();
    const user = data.data as UserDTO;

    // Extract roles from user (if available)
    // For now, roles are not in UserDTO, so we return empty array
    // In the future, roles can be added to UserDTO or fetched separately
    const roles: string[] = [];

    return {
      userId: session.userId,
      user,
      roles,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Require Strike session - throws if not authenticated
 */
export async function requireStrikeSession(): Promise<StrikeSession> {
  const session = await getStrikeSession();
  if (!session) {
    throw new Error('Strike authentication required');
  }
  return session;
}

/**
 * Require Strike session with profile - throws if not authenticated
 * Use this when you need full user data in server components
 */
export async function requireStrikeSessionWithProfile(): Promise<StrikeSessionWithProfile> {
  const session = await getStrikeSessionWithProfile();
  if (!session) {
    throw new Error('Strike authentication required');
  }
  return session;
}

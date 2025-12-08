import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { buildSteamLoginUrl } from '@/lib/server/steam-openid';
import { requireStrikeSession } from '@/lib/server/strike-auth';

const STATE_COOKIE = 'steam_link_state';

interface SteamLinkState {
  nonce: string;
  userId: string;
  redirect: string;
}

async function setStateCookie(state: SteamLinkState) {
  const value = Buffer.from(JSON.stringify(state)).toString('base64url');
  (await cookies()).set(STATE_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 300,
  });
}

/**
 * Steam Auth Initiation Route
 * 
 * Verifies user is authenticated in Strike, then redirects to Steam OpenID.
 * This route only handles the initiation phase.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  try {
    // Verify Strike session exists
    const session = await requireStrikeSession();

    // Get redirect path from query params (default to /games)
    const redirectPath = url.searchParams.get('redirect') || '/games';

    // Generate nonce for CSRF protection
    const nonce = randomUUID();

    // Create state object compatible with service
    const state = {
      nonce,
      userId: session.userId,
      redirect: redirectPath,
    };

    const stateBase64 = Buffer.from(JSON.stringify(state)).toString('base64url');

    // Store state in cookie (must match what service expects)
    console.error('[STEAM AUTH] Setting state cookie:', stateBase64);
    (await cookies()).set(STATE_COOKIE, stateBase64, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 300,
    });

    // Build Steam OpenID URL and redirect
    const steamUrl = buildSteamLoginUrl(stateBase64);
    return NextResponse.redirect(steamUrl);
  } catch {
    // No Strike session - redirect to login with error
    return NextResponse.redirect(new URL('/auth/login?error=steam_requires_auth', url.origin));
  }
}


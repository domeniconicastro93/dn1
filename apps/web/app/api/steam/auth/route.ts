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
 * Creates a secure one-time SteamLinkSession in DB, then redirects to Steam OpenID.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  try {
    // Verify Strike session exists
    const session = await requireStrikeSession();

    // Get redirect path from query params (default to /games)
    const redirectPath = url.searchParams.get('redirect') || '/games';

    // Create secure one-time link session in DB
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const nonce = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const linkSession = await prisma.steamLinkSession.create({
      data: {
        userId: session.userId,
        nonce,
        redirect: redirectPath,
        expiresAt
      }
    });

    await prisma.$disconnect();

    console.log('[CONNECT steam] ============================================');
    console.log('[CONNECT steam] USER AUTHENTICATED');
    console.log('[CONNECT steam] userId =', session.userId);
    console.log('[CONNECT steam] linkSessionId =', linkSession.id);
    console.log('[CONNECT steam] expiresAt =', expiresAt.toISOString());
    console.log('[CONNECT steam] SECURE: Using DB-backed one-time session');
    console.log('[CONNECT steam] ============================================');

    // Build Steam OpenID URL with session ID as state
    const steamUrl = buildSteamLoginUrl(linkSession.id);
    console.log('[CONNECT steam] Redirecting to Steam OpenID...');
    return NextResponse.redirect(steamUrl);
  } catch (error: any) {
    console.error('[CONNECT steam] Error:', error.message);
    // No Strike session - redirect to login with error
    return NextResponse.redirect(new URL('/auth/login?error=steam_requires_auth', url.origin));
  }
}


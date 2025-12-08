import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { validateSteamCallback } from '@/lib/server/steam-openid';
import { linkSteamAccount } from '@/lib/server/steam-link';
import { requireStrikeSession } from '@/lib/server/strike-auth';

const STATE_COOKIE = 'steam_link_state';

interface SteamLinkState {
  nonce: string;
  userId: string;
  redirect: string;
}

async function syncSteamIdToUserProfile(userId: string, steamId64: string) {
  const apiUrl = process.env.USER_SERVICE_URL;
  const apiToken = process.env.USER_SERVICE_TOKEN;
  if (!apiUrl || !apiToken) return;

  try {
    await fetch(`${apiUrl.replace(/\/$/, '')}/api/user/v1/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ steamId64 }),
    });
  } catch (error) {
    console.warn('Failed to sync Steam ID to user profile', error);
  }
}

async function consumeStateCookie(): Promise<SteamLinkState | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(STATE_COOKIE)?.value;
  if (!raw) return null;
  cookieStore.delete(STATE_COOKIE);
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf-8');
    return JSON.parse(json) as SteamLinkState;
  } catch {
    return null;
  }
}

/**
 * Steam OpenID Callback Route
 * 
 * Handles the Steam OpenID callback after user authenticates with Steam.
 * Validates the response, extracts SteamID64, and links it to the Strike user.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  console.error('DEBUG: STEAM CALLBACK HIT');

  try {
    // Verify Strike session still exists
    const allCookies = (await cookies()).getAll();
    console.error('[STEAM CALLBACK] All Cookies:', allCookies.map(c => `${c.name}=${c.value}`).join('; '));

    const session = await requireStrikeSession();
    console.error('[STEAM CALLBACK] Session found:', session.userId);

    // Get state from cookie and query param
    const stateCookie = await consumeStateCookie();
    console.error('[STEAM CALLBACK] State cookie:', stateCookie);
    const stateParam = url.searchParams.get('state');
    console.error('[STEAM CALLBACK] State param:', stateParam);

    // Parse state param
    let stateParamObj: SteamLinkState | null = null;
    try {
      if (stateParam) {
        const json = Buffer.from(stateParam, 'base64url').toString('utf-8');
        stateParamObj = JSON.parse(json) as SteamLinkState;
      }
    } catch (e) {
      console.error('[STEAM CALLBACK] Failed to parse state param:', e);
    }

    // Validate state (CSRF protection)
    if (!stateCookie) {
      console.error('[STEAM CALLBACK] FAIL: No state cookie');
      return NextResponse.redirect(new URL('/games?error=steam_state_invalid&reason=no_cookie', url.origin));
    }
    if (!stateParamObj) {
      console.error('[STEAM CALLBACK] FAIL: Invalid state param');
      return NextResponse.redirect(new URL('/games?error=steam_state_invalid&reason=invalid_param', url.origin));
    }
    if (stateCookie.nonce !== stateParamObj.nonce) {
      console.error('[STEAM CALLBACK] FAIL: Nonce mismatch', { cookie: stateCookie.nonce, param: stateParamObj.nonce });
      return NextResponse.redirect(new URL('/games?error=steam_state_invalid&reason=nonce_mismatch', url.origin));
    }
    if (stateCookie.userId !== session.userId) {
      console.error('[STEAM CALLBACK] FAIL: User mismatch', { cookie: stateCookie.userId, session: session.userId });
      return NextResponse.redirect(new URL('/games?error=steam_state_invalid&reason=user_mismatch', url.origin));
    }

    // Validate Steam OpenID callback
    const validation = await validateSteamCallback(url.searchParams);
    if (!validation.valid || !validation.steamId64) {
      return NextResponse.redirect(new URL('/games?error=steam_validation_failed', url.origin));
    }

    // Link Steam account to Strike user (save to cookie)
    await linkSteamAccount(session.userId, validation.steamId64);

    // Sync to user profile (persist to user-service database)
    await syncSteamIdToUserProfile(session.userId, validation.steamId64);

    // Redirect to original destination or library page
    const redirectTarget = stateCookie.redirect || '/library';
    const redirectUrl = new URL(redirectTarget, url.origin);
    // Add success parameter to show confirmation
    redirectUrl.searchParams.set('steam_linked', '1');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    // Error during callback processing
    const redirectUrl = new URL('/games?error=steam_link_failed', url.origin);
    redirectUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Unexpected error'
    );
    return NextResponse.redirect(redirectUrl);
  }
}

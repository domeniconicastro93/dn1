import { cookies } from 'next/headers';

const STEAM_LINK_COOKIE = 'strike_steam_link';

interface SteamLinkPayload {
  userId: string;
  steamId64: string;
  linkedAt: string;
}

function encodePayload(payload: SteamLinkPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(raw?: string | null): SteamLinkPayload | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf-8');
    return JSON.parse(json) as SteamLinkPayload;
  } catch {
    return null;
  }
}

/**
 * Get linked Steam ID for a user from the DATABASE (NOT cookies)
 * This ensures UI state reflects actual DB state
 */
export async function getLinkedSteamId(userId: string): Promise<string | null> {
  try {
    // Query database directly - this is the source of truth
    const { prisma } = await import('@strike/shared-db');

    console.log('[getLinkedSteamId] ==========================================');
    console.log('[getLinkedSteamId] Prisma import successful');
    console.log('[getLinkedSteamId] DB query for userId:', userId.slice(0, 8) + '...');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamId64: true }
    });

    const steamId64 = user?.steamId64 || null;

    console.log('[getLinkedSteamId] Query result:');
    console.log('[getLinkedSteamId] - User found:', !!user);
    console.log('[getLinkedSteamId] - steamId64:', steamId64 ? '...' + steamId64.slice(-4) : 'NULL');
    console.log('[getLinkedSteamId] ==========================================');

    return steamId64;
  } catch (error: any) {
    console.error('[getLinkedSteamId] ❌ DB query failed:', error.message);
    console.error('[getLinkedSteamId] Stack:', error.stack);
    return null;
  }
}

export async function linkSteamAccount(userId: string, steamId64: string) {
  const payload: SteamLinkPayload = {
    userId,
    steamId64,
    linkedAt: new Date().toISOString(),
  };
  (await cookies()).set(STEAM_LINK_COOKIE, encodePayload(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSteamLink() {
  (await cookies()).delete(STEAM_LINK_COOKIE);
}


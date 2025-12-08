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

export async function getLinkedSteamId(userId: string): Promise<string | null> {
  const payload = decodePayload((await cookies()).get(STEAM_LINK_COOKIE)?.value);
  if (!payload || payload.userId !== userId) {
    return null;
  }
  return payload.steamId64;
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


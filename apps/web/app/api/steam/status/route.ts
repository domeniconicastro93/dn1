import { NextResponse } from 'next/server';
import { getLinkedSteamId } from '@/lib/server/steam-link';
import { getStrikeSession } from '@/lib/server/strike-auth';

export async function GET() {
  const session = await getStrikeSession();
  if (!session) {
    return NextResponse.json({ linked: false, requiresAuth: true });
  }

  const steamId64 = await getLinkedSteamId(session.userId);
  if (!steamId64) {
    return NextResponse.json({ linked: false, requiresAuth: false });
  }

  return NextResponse.json({
    linked: true,
    requiresAuth: false,
    steamId64,
  });
}


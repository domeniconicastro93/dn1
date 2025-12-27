import { NextResponse } from 'next/server';
import { getLinkedSteamId } from '@/lib/server/steam-link';
import { getStrikeSession } from '@/lib/server/strike-auth';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('[FRONTEND DB TRACE] ==========================================');
  console.log('[FRONTEND DB TRACE] Steam status endpoint called');

  const session = await getStrikeSession();
  if (!session) {
    console.log('[FRONTEND DB TRACE] No session - user not authenticated');
    return NextResponse.json({ linked: false, requiresAuth: true });
  }

  console.log('[FRONTEND DB TRACE] Session userId:', session.userId);
  console.log('[FRONTEND DB TRACE] Calling getLinkedSteamId...');

  const steamId64 = await getLinkedSteamId(session.userId);

  console.log('[FRONTEND DB TRACE] DB query completed');
  console.log('[FRONTEND DB TRACE] steamId64_in_DB:', steamId64 ? ('...' + steamId64.slice(-4)) : 'NULL');
  console.log('[FRONTEND DB TRACE] ==========================================');

  if (!steamId64) {
    return NextResponse.json({ linked: false, requiresAuth: false });
  }

  return NextResponse.json({
    linked: true,
    requiresAuth: false,
    steamId64,
  });
}


import { NextRequest, NextResponse } from 'next/server';
import { fetchUserLibrary } from '@/lib/server/user-library';
import { getAccessToken } from '@/lib/server/strike-auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessToken();
    console.log('[API Route] /api/user/library called');
    console.log('[API Route] Access Token present:', !!token);

    const { ownedGames, totalCount, privacyState } = await fetchUserLibrary();
    console.log(`[API Route] fetchUserLibrary returned ${ownedGames.length} games. Privacy: ${privacyState}`);

    return NextResponse.json({ ownedGames, totalCount, privacyState });
  } catch (error) {
    console.error('Error in /api/user/library:', error);
    return NextResponse.json({ ownedGames: [], totalCount: 0, privacyState: 'unknown' });
  }
}


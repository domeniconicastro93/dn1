import { NextRequest, NextResponse } from 'next/server';
import { loadUserOwnedGames } from '@/lib/server/user-library';

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get('forceRefresh') === '1';
    const library = await loadUserOwnedGames();
    return NextResponse.json(library);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch Steam library';
    const status = message === 'Strike authentication required'
      ? 401
      : message === 'Steam account not linked'
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}


import { NextResponse } from 'next/server';
import { fetchInstalledGames } from '@/lib/server/steam-library';

/**
 * GET /api/steam/library
 * 
 * Fetches installed Steam games from the steam-library-service.
 * 
 * NOTE: This route is kept for backward compatibility.
 * New code should use /api/compute/applications instead.
 */
export async function GET() {
  try {
    const library = await fetchInstalledGames();
    return NextResponse.json(library);
  } catch (error) {
    console.error('Error fetching Steam library:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch Steam library',
        games: [],
        vmId: undefined,
        vmName: undefined,
        region: undefined,
        status: 'error',
      },
      { status: 500 }
    );
  }
}


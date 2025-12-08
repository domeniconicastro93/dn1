import { NextResponse } from 'next/server';
import { fetchInstalledGames } from '@/lib/server/steam-library';

export async function GET() {
  try {
    const data = await fetchInstalledGames();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load installed games' },
      { status: 500 }
    );
  }
}


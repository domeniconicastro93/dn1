import { NextResponse } from 'next/server';
import { fetchRawSteamLibrary } from '@/lib/server/steam-library';

export async function GET() {
  try {
    const data = await fetchRawSteamLibrary();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load Steam library' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { syncSteamLibrary } from '@/lib/server/steam-library';

export async function POST() {
  try {
    const data = await syncSteamLibrary();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync Steam library' },
      { status: 500 }
    );
  }
}


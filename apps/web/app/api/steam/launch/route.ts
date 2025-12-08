import { NextRequest, NextResponse } from 'next/server';
import {
  ComputeConnectionError,
  startComputeSession,
} from '@/lib/compute-health';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sunshineAppId = body?.sunshineAppId || body?.appId || body?.steamAppId;

    if (!sunshineAppId) {
      return NextResponse.json(
        { error: 'sunshineAppId is required to launch a game.' },
        { status: 400 }
      );
    }

    const session = await startComputeSession(sunshineAppId);
    return NextResponse.json(session);
  } catch (error) {
    const status =
      error instanceof ComputeConnectionError && error.status
        ? error.status === 0
          ? 502
          : error.status
        : 500;
    const message =
      error instanceof Error ? error.message : 'Failed to contact compute orchestrator';
    return NextResponse.json({ error: message }, { status });
  }
}


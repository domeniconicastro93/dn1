'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { CloudGamingPlayer } from './CloudGamingPlayer';
import { SaveReplayButton } from './SaveReplayButton';
import type { GameSession } from '@/types/phase2';

const SESSION_STORAGE_NAMESPACE = 'strike:compute-session:';

function coerceStatus(value: unknown): GameSession['status'] {
  const allowed: GameSession['status'][] = ['starting', 'active', 'paused', 'ended', 'error'];
  if (typeof value === 'string' && allowed.includes(value as GameSession['status'])) {
    return value as GameSession['status'];
  }
  return 'starting';
}

import dynamic from 'next/dynamic';

// ✅ NEW: Real WebRTC streaming (replaces Apollo)
const WebRTCStreamPlayer = dynamic(() => import('../WebRTCStreamPlayer').then(m => ({ default: m.WebRTCStreamPlayer })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading Strike WebRTC player...</p>
      </div>
    </div>
  ),
});

export function PlayPage() {
  const searchParams = useSearchParams();
  const gameIdParam = searchParams.get('gameId');
  const sessionId = searchParams.get('sessionId');
  const steamAppId = searchParams.get('steamAppId');
  const sunshineAppId = searchParams.get('sunshineAppId');
  const vmId = searchParams.get('vmId') ?? 'vm-arcade-01';

  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No active session was returned by the orchestrator.');
      setLoading(false);
      return;
    }

    let stored: Record<string, unknown> | null = null;
    if (typeof window !== 'undefined') {
      const raw = window.sessionStorage.getItem(`${SESSION_STORAGE_NAMESPACE}${sessionId}`);
      if (raw) {
        try {
          stored = JSON.parse(raw);
        } catch {
          stored = null;
        }
      }
    }

    const derivedGameId =
      gameIdParam ||
      (typeof stored?.gameId === 'string' ? stored.gameId : sunshineAppId || steamAppId || 'unknown');

    const streamUrl =
      (typeof stored?.streamUrl === 'string' && stored.streamUrl) ||
      ((stored as { webrtc?: { streamUrl?: string } })?.webrtc?.streamUrl as string | undefined) ||
      `wss://stream.arcade.strike.gg/${sessionId}`;

    const controlUrl =
      (typeof stored?.controlChannelUrl === 'string' && stored.controlChannelUrl) ||
      ((stored as { controlUrl?: string })?.controlUrl as string | undefined) ||
      ((stored as { webrtc?: { controlUrl?: string } })?.webrtc?.controlUrl as string | undefined) ||
      `wss://control.arcade.strike.gg/${sessionId}`;

    const startedAt =
      (typeof stored?.startedAt === 'string' && stored.startedAt) || new Date().toISOString();

    setSession({
      id: sessionId,
      gameId: derivedGameId,
      userId: 'arcade_user',
      streamUrl,
      controlChannelUrl: controlUrl,
      status: stored ? coerceStatus(stored.status) : 'starting',
      startedAt,
      host: stored?.host as string | undefined,
      port: stored?.port as number | undefined,
      udpPorts: stored?.udpPorts as number[] | undefined,
      protocol: stored?.protocol as string | undefined,
      useHttps: stored?.useHttps as boolean | undefined,
      appId: stored?.appId as string | undefined,
    });
    setLoading(false);
  }, [gameIdParam, sessionId, steamAppId, sunshineAppId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">
            {sessionId
              ? `Connecting to Sunshine session ${sessionId}…`
              : 'Starting your compute session…'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Session not found'}</p>
          <Link href="/games" className="text-white underline">
            Browse Games
          </Link>
        </div>
      </div>
    );
  }

  // ✅ NEW: Use WebRTC streaming (via orchestrator) for all sessions
  return (
    <WebRTCStreamPlayer
      sessionId={session.id}
      orchestratorUrl="/api/orchestrator/v1"
      width={1920}
      height={1080}
      fps={60}
      bitrate={10000}
    />
  );

  return (
    <div className="min-h-screen bg-black relative">
      <CloudGamingPlayer session={session} />
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-right text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Sunshine Session</p>
          <p className="text-sm font-semibold break-all">{session.id}</p>
          {vmId && <p className="text-xs text-white/50">VM · {vmId}</p>}
          {sunshineAppId && (
            <p className="text-xs text-emerald-200">Sunshine app {sunshineAppId} · active</p>
          )}
          {steamAppId && (
            <p className="text-xs text-white/50">Steam app {steamAppId}</p>
          )}
        </div>
        <SaveReplayButton sessionId={session.id} gameId={session.gameId} />
      </div>
    </div>
  );
}


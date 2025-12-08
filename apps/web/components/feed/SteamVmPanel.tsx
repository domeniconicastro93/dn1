'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  type ComputeApplication,
  type ComputeDiagnostics,
  getComputeDiagnostics,
  normalizeApplicationStatus,
  normalizeApplicationTitle,
} from '@/lib/compute-health';
import { cn } from '@/lib/utils';

export function SteamVmPanel() {
  const [diagnostics, setDiagnostics] = useState<ComputeDiagnostics | null>(null);
  const [applications, setApplications] = useState<ComputeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const diag = await getComputeDiagnostics();
        if (!mounted) {
          return;
        }
        setDiagnostics(diag);
        if (diag.ok && diag.applications) {
          setApplications(diag.applications.applications || []);
          setError(null);
        } else {
          setApplications([]);
          setError(diag.error || 'Unable to reach the VM orchestrator.');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to reach the VM orchestrator.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayedApps = applications;

  const vmName =
    diagnostics?.applications?.vmName ||
    diagnostics?.status?.vmName ||
    'Detecting VM';
  const region =
    diagnostics?.applications?.region ||
    diagnostics?.status?.region ||
    '—';
  const statusLabel =
    diagnostics?.status?.status ||
    diagnostics?.applications?.status ||
    (diagnostics?.ok ? 'online' : 'unknown');
  const lastSyncedAt = diagnostics?.applications?.lastSyncedAt || null;

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return '—';
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(lastSyncedAt));
    } catch {
      return lastSyncedAt;
    }
  }, [lastSyncedAt, locale]);

  const handleLaunch = async (app: ComputeApplication) => {
    const sunshineId = app.sunshineAppId || app.appId;
    if (!sunshineId) {
      setError('This application is missing a Sunshine appId mapping.');
      return;
    }

    try {
      setLaunchingId(sunshineId);
      const response = await fetch('/api/steam/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sunshineAppId: sunshineId,
          steamAppId: app.steamAppId,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Compute session start failed');
      }

      const data = (payload?.data ?? payload) as Record<string, unknown>;
      const sessionId = (data?.sessionId as string) || '';
      if (typeof window !== 'undefined' && sessionId) {
        window.sessionStorage.setItem(`strike:compute-session:${sessionId}`, JSON.stringify(data));
      }

      const params = new URLSearchParams();
      if (sessionId) params.set('sessionId', sessionId);
      if (app.steamAppId) params.set('steamAppId', app.steamAppId);
      params.set('sunshineAppId', sunshineId);
      if (typeof data?.vmId === 'string' && data.vmId) params.set('vmId', data.vmId);
      const gameId =
        (typeof data?.gameId === 'string' && data.gameId) || app.appId || sunshineId;
      params.set('gameId', gameId);

      router.push(`/${locale}/play?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Sunshine session.');
    } finally {
      setLaunchingId(null);
    }
  };

  const showDiagnosticsWarning = !loading && (!diagnostics?.ok || error);

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#140946] via-[#170a3c] to-[#06021c] p-6 md:p-8 shadow-2xl shadow-indigo-900/30">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-white/60">Steam VM</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white">{vmName}</h2>
          <p className="text-sm text-white/60 mt-1">
            Region · {region} · Status ·{' '}
            <span
              className={cn(
                'font-semibold',
                statusLabel?.toLowerCase() === 'online' ? 'text-emerald-300' : 'text-yellow-300'
              )}
            >
              {statusLabel}
            </span>
          </p>
        </div>
        <div className="text-sm text-white/60">
          Last synced <span className="text-white font-medium">{lastSyncedLabel}</span>
        </div>
      </div>

      {showDiagnosticsWarning && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          <p className="font-semibold">Strike cannot reach your VM orchestrator.</p>
          <p className="mt-2 text-red-100">Check that:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-red-100">
            <li>The VM is running</li>
            <li>Sunshine is active</li>
            <li>The orchestrator service is running</li>
            <li>The variable NEXT_PUBLIC_COMPUTE_URL is set correctly</li>
          </ul>
          {error && <p className="mt-3 text-xs text-red-200">Details: {error}</p>}
        </div>
      )}

      {loading && (
        <div className="mt-6 text-white/70 text-sm">Fetching Sunshine applications…</div>
      )}

      {!loading && !displayedApps.length && (
        <p className="mt-6 text-sm text-white/50">
          No applications reported by Sunshine. Sync the VM to refresh the installed titles.
        </p>
      )}

      {!loading && displayedApps.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-white/80 text-sm">
              <p className="font-semibold text-2xl text-white">{displayedApps.length}</p>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Installed apps</p>
            </div>
            <Link
              href={`/${locale}/library`}
              className="rounded-full border border-white/30 px-5 py-2 text-sm text-white hover:bg-white/10"
            >
              View My Games
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {displayedApps.map((app) => {
              const sunshineId = app.sunshineAppId || app.appId;
              const status = normalizeApplicationStatus(app);
              return (
                <div
                  key={`${app.sunshineAppId || app.appId}-${app.steamAppId || ''}`}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">
                      {normalizeApplicationTitle(app)}
                    </p>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full capitalize',
                        status === 'installed' || status === 'ready'
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : status === 'needs_update' || status === 'mapping_required'
                          ? 'bg-amber-500/20 text-amber-100'
                          : 'bg-sky-500/20 text-sky-100'
                      )}
                    >
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  {app.description && (
                    <p className="text-xs text-white/70">{app.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {app.genres?.map((genre) => (
                      <span
                        key={`${sunshineId}-${genre}`}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition',
                        sunshineId
                          ? 'bg-white text-[#080427] hover:bg-white/90'
                          : 'bg-white/10 text-white/50 cursor-not-allowed',
                        launchingId === sunshineId && 'opacity-70 pointer-events-none'
                      )}
                      onClick={() => handleLaunch(app)}
                      disabled={!sunshineId || launchingId === sunshineId}
                    >
                      {launchingId === sunshineId ? 'Launching…' : 'Launch & Stream'}
                    </button>
                    {!sunshineId && (
                      <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
                        Mapping required
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SteamUserLibraryResponse, SteamUserLibraryEntry } from '@strike/shared-types';
import { cn } from '@/lib/utils';

interface Props {
  library?: SteamUserLibraryResponse | null;
  locale: string;
}

const STATUS_LABELS: Record<SteamUserLibraryEntry['status'], string> = {
  playable: 'Playable Now',
  owned_not_installed: 'Owned but not installed',
  installed_not_owned: 'Installed but not owned',
};

export function UserLibraryGrid({ library, locale }: Props) {
  const router = useRouter();
  const [isSyncing, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      await fetch('/api/user/steam/library?forceRefresh=1', { cache: 'no-store' });
      router.refresh();
    });
  };

  const handleLaunch = (entry: SteamUserLibraryEntry) => {
    if (!entry.sunshineAppId) return;
    const params = new URLSearchParams();
    params.set('gameId', entry.steamAppId);
    params.set('steamAppId', entry.steamAppId);
    params.set('sunshineAppId', entry.sunshineAppId);
    router.push(`/${locale}/play?${params.toString()}`);
  };

  if (!library) {
    return (
      <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white/70">
        <p className="text-lg font-semibold text-white">Connect your Steam account</p>
        <p className="mt-2 text-sm text-white/60">
          Log in with Steam to see your owned games, installed titles, and playable experiences on
          this VM.
        </p>
        <a
          href={`/api/steam/auth?redirect=/${locale}/library`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#080427] transition hover:bg-white/90"
        >
          Login with Steam
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">Steam Library</p>
          <h1 className="text-4xl font-semibold text-white">{library.profile?.personaName ?? 'My Games'}</h1>
          <p className="text-sm text-white/60">
            <span className="text-emerald-300">{library.counts.playable} playable now</span>
            {' · '}
            <span className="text-amber-300">{library.counts.ownedNotInstalled} owned, not installed</span>
            {' · '}
            <span className="text-white/40">{library.counts.installedNotOwned} installed, not owned</span>
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
        >
          {isSyncing ? 'Syncing…' : 'Sync Library'}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {library.entries.map((entry) => (
          <article
            key={`${entry.steamAppId}-${entry.sunshineAppId ?? 'none'}`}
            className={cn(
              'flex gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-4 shadow-xl shadow-black/20 backdrop-blur',
              entry.status === 'installed_not_owned' && 'opacity-70'
            )}
          >
            <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-black/40">
              {entry.metadata?.headerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.metadata.headerImage}
                  alt={entry.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                  {entry.title.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{entry.title}</h2>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Steam App {entry.steamAppId}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    entry.status === 'playable'
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
                      : entry.status === 'owned_not_installed'
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  )}
                >
                  {STATUS_LABELS[entry.status]}
                </span>
              </div>
              {entry.metadata?.playtimeMinutes && (
                <p className="text-xs text-white/60">
                  {(entry.metadata.playtimeMinutes / 60).toFixed(1)} hrs on record
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {entry.status === 'playable' && entry.sunshineAppId ? (
                  <button
                    onClick={() => handleLaunch(entry)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#080427] transition hover:bg-white/90"
                  >
                    Launch & Stream
                  </button>
                ) : entry.status === 'owned_not_installed' ? (
                  <div className="flex flex-col gap-2">
                    <button
                      disabled
                      className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 cursor-not-allowed"
                    >
                      Install on VM
                    </button>
                    <p className="text-xs text-white/50">
                      This game is in your Steam library but not installed on the VM
                    </p>
                  </div>
                ) : entry.status === 'installed_not_owned' ? (
                  <div className="flex flex-col gap-2">
                    <button
                      disabled
                      className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/40 cursor-not-allowed"
                    >
                      Not in your library
                    </button>
                    <p className="text-xs text-white/50">
                      This game is installed on the VM but not in your Steam library
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


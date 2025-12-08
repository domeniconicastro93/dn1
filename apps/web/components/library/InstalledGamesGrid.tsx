'use client';

import { useMemo, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SteamInstalledGameDTO, SteamLibraryResponseDTO } from '@strike/shared-types';
import { cn } from '@/lib/utils';

interface Props {
  library: SteamLibraryResponseDTO;
  locale: string;
}

export function InstalledGamesGrid({ library, locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSyncing, startSync] = useTransition();

  const sortedGames = useMemo(
    () =>
      [...library.games].sort((a, b) =>
        (a.metadata?.lastUpdated || '').localeCompare(b.metadata?.lastUpdated || '')
      ),
    [library.games]
  );

  const handleLaunch = (game: SteamInstalledGameDTO) => {
    if (!game.sunshineAppId) return;
    router.push(
      `/${locale}/play?gameId=${encodeURIComponent(game.appId)}&steamAppId=${encodeURIComponent(
        game.appId
      )}&sunshineAppId=${encodeURIComponent(game.sunshineAppId)}`
    );
  };

  const handleSync = () => {
    startSync(async () => {
      await fetch('/api/games/steam/sync', { method: 'POST' });
      router.replace(pathname);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">Steam VM</p>
          <h1 className="text-4xl font-semibold text-white">{library.vmName}</h1>
          <p className="text-sm text-white/60">
            {library.region} · {library.games.length} installed titles
          </p>
        </div>
        <button
          className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing…' : 'Sync Library'}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sortedGames.map((game) => (
          <article
            key={game.appId}
            className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-5 shadow-xl shadow-black/20 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{game.title}</h2>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Steam App {game.appId}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  game.sunshineAppId ? 'bg-emerald-500/20 text-emerald-100' : 'bg-white/10 text-white/60'
                )}
              >
                {game.sunshineAppId ? 'Ready' : 'Mapping needed'}
              </span>
            </div>
            {game.metadata?.description && (
              <p className="mt-3 text-sm text-white/70 line-clamp-3">{game.metadata.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {game.metadata?.genres?.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                >
                  {genre}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  game.sunshineAppId
                    ? 'bg-white text-[#080427] hover:bg-white/90'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                )}
                disabled={!game.sunshineAppId}
                onClick={() => handleLaunch(game)}
              >
                Launch & Stream
              </button>
              {game.metadata?.playtimeMinutes && (
                <span className="text-xs text-white/50">
                  {Math.round(game.metadata.playtimeMinutes / 60)} hrs played
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


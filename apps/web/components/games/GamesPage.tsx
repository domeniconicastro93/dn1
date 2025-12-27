'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SteamUserLibraryEntry } from '@strike/shared-types';
import { GameCard } from './GameCard';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSteamLinkStatus } from '@/hooks/useSteamLinkStatus';
import { fetchSteamOwnedGames } from '@/lib/api/steam';

import type { Game } from '@/types/phase2';

export function GamesPage() {
  const t = useTranslations('games');
  const locale = useLocale();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const steamStatus = useSteamLinkStatus();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const [games, setGames] = useState<Game[]>([]);
  const [ownedGameIds, setOwnedGameIds] = useState<string[]>([]);
  const [privacyState, setPrivacyState] = useState<'public' | 'private' | 'friendsOnly' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        // Fetch Catalog with Pagination
        const gamesRes = await fetch(`${apiUrl}/api/game/v1?page=${page}&pageSize=${pageSize}`);
        if (gamesRes.ok) {
          const data = await gamesRes.json();
          if (data.data && data.data.games) {
            setGames(data.data.games);
            // Calculate total pages
            const total = data.data.total || 0;
            setTotalPages(Math.ceil(total / pageSize));
          }
        }

        // Fetch Owned Games (if logged in) - only on first load or if status changes
        // We don't need to re-fetch owned games on every page change, but for simplicity we keep it here
        // Optimization: Check if we already have ownedGameIds and only fetch if empty or forced
        try {
          console.log('[GamesPage] Fetching Steam owned games...');
          const data = await fetchSteamOwnedGames();
          console.log('[GamesPage] Steam API Response:', data);

          const ownedGames = data.ownedGames || [];
          const receivedPrivacyState = data.privacyState || 'unknown';

          console.log('[GamesPage] Owned games count:', ownedGames.length);
          console.log('[GamesPage] Privacy state:', receivedPrivacyState);

          setPrivacyState(receivedPrivacyState);

          // CRITICAL: If privacy is NOT public, clear owned games immediately
          if (receivedPrivacyState !== 'public') {
            console.log('[GamesPage] ❌ Privacy is NOT public - clearing owned games');
            setOwnedGameIds([]);
          } else {
            // Strict String Mapping
            const ownedIds = ownedGames.map((g: any) => String(g.appid));
            console.log('[GamesPage] ✅ Privacy is public - setting owned IDs:', ownedIds);
            setOwnedGameIds(ownedIds);
          }
        } catch (e) {
          console.error('[GamesPage] Fetch failed:', e);
          // On error, clear owned games
          setOwnedGameIds([]);
        }
      } catch (error) {
        console.error('[GamesPage] Exception:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]); // Re-run when page changes

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#080427] py-8">
      <div className="container mx-auto px-5 md:px-20">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-300 mb-6">
            {t('description')}
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
              <h3 className="text-red-200 font-semibold mb-1">Connection Failed</h3>
              <p className="text-red-300 text-sm">
                {message || error}
              </p>
            </div>
          )}

          {/* Steam Connect Banner */}
          {steamStatus.requiresAuth ? (
            <div className="mb-8 p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl flex items-center justify-between">
              <span className="text-blue-200">Log in to link your Steam account and play games.</span>
              <button onClick={() => router.push('/auth/login')} className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-semibold hover:bg-blue-500 transition">Log In</button>
            </div>
          ) : !steamStatus.linked && !steamStatus.loading ? (
            <div className="mb-8 p-4 bg-purple-900/30 border border-purple-500/30 rounded-xl flex items-center justify-between">
              <span className="text-purple-200">Link your Steam account to access your library.</span>
              <button
                onClick={() => {
                  const redirect = encodeURIComponent(`/${locale}/games`);
                  window.location.href = `/api/steam/auth?redirect=${redirect}`;
                }}
                className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-semibold hover:bg-purple-500 transition"
              >
                Connect Steam
              </button>
            </div>
          ) : steamStatus.linked ? (
            <div className="mb-8 p-4 bg-green-900/30 border border-green-500/30 rounded-xl flex items-center justify-between relative">
              <span className="text-green-200">Steam Connected</span>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-4 py-2 bg-green-600 rounded-lg text-white text-sm font-semibold hover:bg-green-500 transition flex items-center gap-2"
                >
                  Connected
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
                  >
                    <button
                      onClick={async () => {
                        try {
                          // Call disconnect API
                          const res = await fetch('/api/steam/disconnect', {
                            method: 'POST',
                            credentials: 'include',
                          });

                          if (res.ok) {
                            // Reload page to reflect disconnected state
                            window.location.reload();
                          } else {
                            console.error('Failed to disconnect Steam');
                          }
                        } catch (error) {
                          console.error('Error disconnecting Steam:', error);
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 rounded-lg transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Disconnetti
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Privacy Warning Banner */}
          {steamStatus.linked && (privacyState === 'private' || privacyState === 'friendsOnly' || privacyState === 'unknown') && (
            <div className="mb-8 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-xl flex items-start gap-3">
              <div className="text-yellow-500 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M3.32 12.68a9 9 0 1 0 17.36 0" /></svg>
              </div>
              <div>
                <h3 className="text-yellow-200 font-semibold mb-1">Your Steam library is private</h3>
                <p className="text-yellow-300/80 text-sm">
                  We couldn't find any games in your library. This usually happens when your Steam Game Details are set to "Private" or "Friends Only".
                  <br />
                  Please set your Game Details to <strong>Public</strong> in your Steam Privacy Settings to play.
                </p>
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-yellow-400 hover:text-yellow-300 text-sm font-medium underline"
                >
                  Edit Steam Privacy Settings
                </a>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* My Library Section */}
        {steamStatus.linked && privacyState === 'public' && ownedGameIds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">My Library</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games
                .filter(game => game.steamAppId && ownedGameIds.includes(game.steamAppId))
                .map(game => (
                  <GameCard
                    key={`library-${game.id}`}
                    game={game}
                    status="owned"
                  />
                ))}
            </div>
          </div>
        )}

        {/* All Games Grid */}
        <h2 className="text-2xl font-bold text-white mb-6">All Games</h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading library...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No games available yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {games.map((game) => {
                // Strict ownership check: game.steamAppId MUST match an owned ID
                const isOwned = game.steamAppId ? ownedGameIds.includes(String(game.steamAppId)) : false;

                const status = !steamStatus.linked
                  ? 'steam_not_linked'
                  : isOwned
                    ? 'owned'
                    : 'not_owned';

                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    status={status}
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-lg font-semibold transition",
                        page === pageNum
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

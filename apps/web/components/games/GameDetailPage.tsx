'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import Image from 'next/image';
import type { Game } from '@/types/phase2';
import { useSteamLinkStatus } from '@/hooks/useSteamLinkStatus';

interface GameDetailPageProps {
  slug: string;
}

export function GameDetailPage({ slug }: GameDetailPageProps) {
  const t = useTranslations('games');
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [libraryEmpty, setLibraryEmpty] = useState(false);
  const steamStatus = useSteamLinkStatus();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/game/v1/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setGame(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch game:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [slug]);

  useEffect(() => {
    if (game && steamStatus.linked) {
      console.log('[DBG GameDetailPage] Checking ownership for game:', game.title);
      console.log('[DBG GameDetailPage] steamAppId from game:', game.steamAppId);

      // Fetch owned games from the correct API endpoint
      fetch('/api/steam/owned-games', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          console.log('[DBG GameDetailPage] Owned games response:', data);
          console.log('[DBG GameDetailPage] ownedGames array length:', data.ownedGames?.length || 0);

          if (data.ownedGames && data.ownedGames.length > 0) {
            console.log('[DBG GameDetailPage] Sample owned game:', data.ownedGames[0]);
          }

          if (game.steamAppId && data.ownedGames) {
            // Check ownership by matching steamAppId
            const owned = data.ownedGames.some((g: any) => {
              const match = String(g.steamAppId) === String(game.steamAppId);
              if (match) {
                console.log('[DBG GameDetailPage] ✅ MATCH FOUND:', {
                  gameSteamAppId: game.steamAppId,
                  ownedGameSteamAppId: g.steamAppId,
                  gameName: g.name
                });
              }
              return match;
            });

            console.log('[DBG GameDetailPage] Ownership result:', owned);
            setIsOwned(owned);

            // Check if library is empty (potential privacy issue)
            if (data.ownedGames.length === 0 && data.privacyState === 'private') {
              console.log('[DBG GameDetailPage] Library is empty and private');
              setLibraryEmpty(true);
            }
          } else {
            console.log('[DBG GameDetailPage] Missing steamAppId or ownedGames');
          }
        })
        .catch(err => {
          console.error('[DBG GameDetailPage] Failed to check ownership:', err);
        });
    } else {
      console.log('[DBG GameDetailPage] Skipping ownership check:', {
        hasGame: !!game,
        steamLinked: steamStatus.linked
      });
    }
  }, [game, steamStatus.linked]);


  const handlePlay = async () => {
    if (!game) return;

    try {
      setStartingSession(true);

      // Get user from session/auth context
      // For now, we'll use a placeholder - this should come from your auth context
      const userId = 'current-user-id'; // TODO: Get from auth context

      const res = await fetch('/api/play/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for JWT
        body: JSON.stringify({
          userId,
          appId: game.id,
          steamAppId: game.steamAppId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to start session');
        return;
      }

      const response = await res.json();
      const session = response.data;

      console.log('[GameDetailPage] Session started:', session);

      // Redirect to play page
      router.push(`/play/${session.sessionId}`);
    } catch (error) {
      console.error('[GameDetailPage] Error starting session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setStartingSession(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Game not found</p>
          <Link href="/games">
            <Button>Browse Games</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080427]">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        {game.coverImageUrl && (
          <Image
            src={game.coverImageUrl}
            alt={game.title}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080427] via-[#080427]/80 to-transparent" />

        <div className="relative z-10 container mx-auto px-5 md:px-20 h-full flex items-end pb-12">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {game.title}
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              {game.description}
            </p>

            {steamStatus.requiresAuth ? (
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => router.push('/auth/login')}
              >
                Log In to Play
              </Button>
            ) : !steamStatus.linked ? (
              <Button
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-500"
                onClick={() => window.location.href = '/api/steam/auth'}
              >
                Connect Steam to Play
              </Button>
            ) : isOwned || !game.steamAppId ? (
              <Button
                size="lg"
                className="bg-white text-[#080427] hover:bg-gray-200"
                onClick={handlePlay}
                disabled={startingSession}
              >
                {startingSession ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#080427]/20 border-t-[#080427] rounded-full animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Play Now
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                disabled
                className="bg-gray-600 text-white/50 cursor-not-allowed"
              >
                Not Owned on Steam
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Warning Banner */}
      {steamStatus.linked && !isOwned && libraryEmpty && (
        <div className="container mx-auto px-5 md:px-20 -mt-8 mb-8 relative z-20">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-full">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-yellow-500 font-semibold mb-1">Game Not Detected?</h3>
              <p className="text-gray-300 text-sm">
                If you own this game on Steam but it shows as "Not Owned", your Steam Privacy settings might be hiding your game library.
                <br />
                Please ensure your <strong>Game details</strong> are set to <strong>Public</strong> in your <a href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">Steam Privacy Settings</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-5 md:px-20 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Game Info */}
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">About</h2>
              <p className="text-gray-300 leading-relaxed">{game.description}</p>
            </div>
          </div>

          <div>
            {/* Sidebar */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Details</h3>
              <dl className="space-y-3">
                {game.genre && (
                  <>
                    <dt className="text-gray-400 text-sm">Genre</dt>
                    <dd className="text-white">{game.genre.join(', ')}</dd>
                  </>
                )}
                {game.developer && (
                  <>
                    <dt className="text-gray-400 text-sm">Developer</dt>
                    <dd className="text-white">{game.developer}</dd>
                  </>
                )}
                {game.publisher && (
                  <>
                    <dt className="text-gray-400 text-sm">Publisher</dt>
                    <dd className="text-white">{game.publisher}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {startingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Animated Spinner */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-white border-r-white/50 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-2 border-4 border-t-transparent border-r-transparent border-b-white/30 border-l-white/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>

              {/* Status Text */}
              <h3 className="text-2xl font-bold text-white mb-2">
                Starting Your Game
              </h3>
              <p className="text-gray-300 mb-4">
                Allocating cloud resources...
              </p>

              {/* Progress Steps */}
              <div className="w-full space-y-2 text-left text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Connecting to VM</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span>Launching game</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span>Preparing stream</span>
                </div>
              </div>

              <p className="text-white/60 text-xs mt-6">
                This may take a few moments...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


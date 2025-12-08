
'use client';

import { Hero } from '@/components/home/Hero';
import { Features } from '@/components/home/Features';
import { OwnedGames } from '@/components/games/OwnedGames';
import { useStrikeSession } from '@/hooks/useStrikeSession';
// Removed Metadata import as it cannot be used in Client Components
// import type { Metadata } from 'next';

// This is a Client Component wrapper for the Home Page content
// to allow using hooks like useStrikeSession

export default function HomePage() {
  const { authenticated, user, loading } = useStrikeSession();

  return (
    <div className="flex flex-col min-h-screen bg-[#080427]">
      {/* Hero Section - Always visible, but maybe different if logged in? 
          For now, keep standard Hero. 
      */}
      {!authenticated && <Hero />}

      {/* Authenticated User Content */}
      {authenticated && !loading && (
        <div className="space-y-12 pb-20">
          {/* Welcome Banner */}
          <div className="relative h-[300px] w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50" />
            <div className="container mx-auto px-5 md:px-20 h-full flex flex-col justify-center relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Welcome back, {user?.displayName || 'Gamer'}
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl">
                Your cloud gaming command center is ready. Jump back into your library or discover something new.
              </p>
            </div>
          </div>

          {/* Owned Games / Steam Link */}
          <OwnedGames />

          {/* Catalog Preview (Features for now, but should be Catalog) */}
          <div className="container mx-auto px-5 md:px-20">
            <h2 className="text-2xl font-bold text-white mb-6">Trending on Strike</h2>
            {/* Placeholder for Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <span className="text-gray-500">Game Preview {i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Public Content (Features) - Only if not authenticated or at bottom */}
      {!authenticated && <Features />}
    </div>
  );
}

'use client';

import { Link } from '@/i18n/routing';
import Image from 'next/image';
import type { Game } from '@/types/phase2';

interface GameCardProps {
  game: Game;
  status: 'owned' | 'not_owned' | 'steam_not_linked';
}

export function GameCard({ game, status }: GameCardProps) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group relative block rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="relative aspect-video">
        <Image
          src={game.thumbnailUrl}
          alt={game.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {status === 'owned' && (
            <span className="px-2 py-1 bg-green-500/80 text-white text-xs font-bold rounded shadow-sm backdrop-blur-sm">
              OWNED
            </span>
          )}
          {status === 'not_owned' && (
            <span className="px-2 py-1 bg-black/60 text-white/70 text-xs font-bold rounded shadow-sm backdrop-blur-sm">
              NOT OWNED
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
          {game.title}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-2">
          {game.description}
        </p>
      </div>
    </Link>
  );
}


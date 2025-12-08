'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { Play, Eye, Heart } from 'lucide-react';
import type { Clip } from '@/types/phase2';

interface ReelsGridProps {
  type: 'for-you' | 'following' | 'explore';
}

export function ReelsGrid({ type }: ReelsGridProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call in Phase 4
    // For now, show empty state
    setLoading(false);
  }, [type]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-[9/16] bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">No clips available yet</p>
        <p className="text-gray-500 text-sm mt-2">Check back soon for new content!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {clips.map((clip) => (
        <Link
          key={clip.id}
          href={`/clips/${clip.id}`}
          className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="relative w-full h-full">
            <Image
              src={clip.thumbnailUrl}
              alt={clip.title || 'Gaming clip'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                {clip.creatorHandle}
              </h3>
              <p className="text-gray-300 text-xs line-clamp-2 mb-2">
                {clip.title || clip.gameTitle}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{clip.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{clip.likes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


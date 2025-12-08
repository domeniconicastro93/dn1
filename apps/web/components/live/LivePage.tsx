'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Eye } from 'lucide-react';
import type { LiveStream } from '@/types/phase2';

export function LivePage() {
  // TODO: Replace with actual API call
  const streams: LiveStream[] = [];

  return (
    <div className="min-h-screen bg-[#080427] py-8">
      <div className="container mx-auto px-5 md:px-20">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Live Streams
          </h1>
          <p className="text-lg text-gray-300">
            Watch the best streamers live now
          </p>
        </div>

        {streams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No live streams at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {streams.map((stream) => (
              <Link
                key={stream.id}
                href={`/live/${stream.id}`}
                className="group relative block rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="relative aspect-video">
                  <Image
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 rounded text-white text-xs font-semibold">
                    LIVE
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded text-white text-xs">
                    <Eye className="w-4 h-4" />
                    <span>{stream.viewerCount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 line-clamp-1">
                    {stream.title}
                  </h3>
                  <p className="text-gray-400 text-sm">@{stream.creatorHandle}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


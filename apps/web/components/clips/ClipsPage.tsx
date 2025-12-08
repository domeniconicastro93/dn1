'use client';

import { ReelsGrid } from '@/components/feed/ReelsGrid';

export function ClipsPage() {
  return (
    <div className="min-h-screen bg-[#080427] py-8">
      <div className="container mx-auto px-5 md:px-20">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Clips & Reels
          </h1>
          <p className="text-lg text-gray-300">
            Watch epic gaming moments from the Strike community
          </p>
        </div>
        <ReelsGrid type="explore" />
      </div>
    </div>
  );
}


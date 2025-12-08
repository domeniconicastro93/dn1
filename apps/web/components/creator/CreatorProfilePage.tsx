'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ReelsGrid } from '@/components/feed/ReelsGrid';
import type { Creator } from '@/types/phase2';

interface CreatorProfilePageProps {
  handle: string;
}

export function CreatorProfilePage({ handle }: CreatorProfilePageProps) {
  const t = useTranslations('creator');
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    setLoading(false);
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Creator not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080427] py-8">
      <div className="container mx-auto px-5 md:px-20">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {creator.avatarUrl && (
              <Image
                src={creator.avatarUrl}
                alt={creator.displayName}
                width={120}
                height={120}
                className="rounded-full"
              />
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">
                  {creator.displayName}
                </h1>
                {creator.isVerified && (
                  <span className="text-blue-400">✓</span>
                )}
              </div>
              <p className="text-gray-400 text-lg mb-4">@{creator.handle}</p>
              {creator.bio && (
                <p className="text-gray-300 max-w-2xl">{creator.bio}</p>
              )}
              <div className="flex items-center gap-6 mt-4">
                <div>
                  <span className="text-white font-semibold">
                    {creator.followerCount.toLocaleString()}
                  </span>
                  <span className="text-gray-400 ml-2">Followers</span>
                </div>
                <div>
                  <span className="text-white font-semibold">
                    {creator.clipCount.toLocaleString()}
                  </span>
                  <span className="text-gray-400 ml-2">Clips</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clips Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Clips</h2>
          <ReelsGrid type="explore" />
        </div>
      </div>
    </div>
  );
}


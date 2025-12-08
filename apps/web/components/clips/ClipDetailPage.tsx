'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ArrowLeft, Eye, Heart, Share2 } from 'lucide-react';
import type { Clip } from '@/types/phase2';

interface ClipDetailPageProps {
  clipId: string;
}

export function ClipDetailPage({ clipId }: ClipDetailPageProps) {
  const [clip, setClip] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    setLoading(false);
  }, [clipId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="min-h-screen bg-[#080427] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Clip not found</p>
          <Link href="/clips">
            <span className="text-white underline">Browse Clips</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080427]">
      <div className="container mx-auto px-5 md:px-20 py-8">
        <Link href="/clips" className="inline-flex items-center gap-2 text-white hover:text-gray-300 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Clips
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden mb-6">
              <video
                src={clip.videoUrl}
                controls
                className="w-full h-full"
                poster={clip.thumbnailUrl}
              />
            </div>

            {/* Clip Info */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {clip.title || clip.gameTitle}
              </h1>
              <div className="flex items-center gap-6 text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{clip.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span>{clip.likes.toLocaleString()}</span>
                </div>
                <button className="flex items-center gap-2 hover:text-white transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <Link href={`/creator/${clip.creatorHandle}`} className="flex items-center gap-4 mb-4">
                {clip.creatorAvatarUrl && (
                  <Image
                    src={clip.creatorAvatarUrl}
                    alt={clip.creatorHandle}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-white font-semibold">@{clip.creatorHandle}</h3>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Eye, Heart, Play } from 'lucide-react';

export function ReelsSection() {
  const t = useTranslations('home.reels');

  const reels = [
    {
      id: 1,
      username: '@gamerpro',
      review: 'Epic headshot compilation!',
      views: '12.5K',
      likes: '2.3K',
      thumbnail: '/images/reel-1.jpg',
      badge: 'Trending',
    },
    {
      id: 2,
      username: '@streamer',
      review: 'Best play of the week!',
      views: '8.9K',
      likes: '1.5K',
      thumbnail: '/images/reel-2.jpg',
      badge: 'New',
    },
    {
      id: 3,
      username: '@proplayer',
      review: 'Incredible clutch moment',
      views: '15.2K',
      likes: '3.1K',
      thumbnail: '/images/reel-3.jpg',
      badge: 'Hot',
    },
    {
      id: 4,
      username: '@esports',
      review: 'Tournament highlights',
      views: '22.4K',
      likes: '4.8K',
      thumbnail: '/images/reel-4.jpg',
      badge: 'Popular',
    },
  ];

  return (
    <section className="relative w-full py-20 bg-[#080427] overflow-hidden">
      <div className="relative z-10 container mx-auto px-5 md:px-20">
        {/* Section Header */}
        <div className="max-w-[1280px] mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('sectionTitle')}
          </h2>
          <p className="text-lg text-gray-300 max-w-[768px]">
            {t('sectionDescription')}
          </p>
        </div>

        {/* Reels Grid */}
        <div className="max-w-[1484px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="relative group cursor-pointer"
              >
                <div className="relative h-[620px] rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 to-black">
                  <Image
                    src={reel.thumbnail}
                    alt={reel.review}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-6 left-6 z-10">
                    <div className="px-3 py-2 bg-white/20 backdrop-blur-sm rounded-md">
                      <span className="text-white text-sm font-medium">{reel.badge}</span>
                    </div>
                  </div>

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-[60px] h-[60px] bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Play className="w-[26px] h-[26px] text-white ml-1" fill="white" />
                    </div>
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="mb-4">
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {reel.username}
                      </h3>
                      <p className="text-gray-300 text-sm">{reel.review}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300 text-sm">{reel.views}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300 text-sm">{reel.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


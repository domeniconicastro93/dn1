'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function FeaturesSection() {
  const t = useTranslations('home.features');

  const features = [
    {
      id: 'tournaments',
      title: 'Tournaments & Events',
      description: 'Compete in tournaments and earn rewards. Join events and climb the leaderboard.',
      image: '/images/feature-tournaments.jpg',
    },
    {
      id: 'streaming',
      title: 'Live Streaming',
      description: 'Stream your gameplay live and connect with your audience in real-time.',
      image: '/images/feature-streaming.jpg',
    },
    {
      id: 'wallet',
      title: 'Wallet & Payments',
      description: 'Manage your earnings, deposits, and withdrawals all in one place.',
      image: '/images/feature-wallet.jpg',
    },
  ];

  return (
    <section className="relative w-full py-20 bg-[#080427] overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#1a1a3a]/50 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-5 md:px-20">
        {/* Section Header */}
        <div className="max-w-[1280px] mx-auto mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-[768px]">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {t('sectionTitle')}
              </h2>
              <p className="text-lg text-gray-300">
                {t('sectionDescription')}
              </p>
            </div>
            <button className="px-6 py-3 border border-white/20 text-white hover:bg-white/10 transition-colors rounded-md">
              {t('viewAll')}
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className="relative group"
              >
                <div className="relative h-[334px] rounded-lg overflow-hidden mb-6">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                
                <div className="px-8">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function HeroSection() {
  const t = useTranslations('home.hero');

  return (
    <section className="relative w-full min-h-[824px] flex items-center justify-center overflow-hidden bg-[#080427]">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080427] via-[#080427] to-[#1a1a3a] z-0" />
      
      {/* Background decorative pattern */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 md:px-20">
        <div className="max-w-[589px] flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-[480px]">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-[140px] h-12 bg-white text-[#080427] hover:bg-gray-200">
              {t('cta')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-[211px] h-12 border-white text-white hover:bg-white/10"
            >
              {t('learnMore')}
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-[262px] bg-gradient-to-t from-[#1a1a3a] to-transparent z-0" />
    </section>
  );
}


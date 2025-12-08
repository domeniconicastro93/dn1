'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function CTASection() {
  const t = useTranslations('home.cta');

  return (
    <section className="relative w-full py-20 bg-[#080427] overflow-hidden">
      <div className="relative z-10 container mx-auto px-5 md:px-20">
        <div className="max-w-[1280px] mx-auto">
          <div className="relative rounded-lg overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/images/cta-background.jpg"
                alt="CTA background"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080427]/90 to-[#080427]/70" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-16 md:p-20">
              <div className="max-w-[620px]">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  {t('title')}
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  {t('description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="w-full sm:w-[140px] h-12 bg-white text-[#080427] hover:bg-gray-200">
                    {t('primaryCta')}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-[211px] h-12 border-white text-white hover:bg-white/10"
                  >
                    {t('secondaryCta')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


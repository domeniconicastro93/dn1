'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function Hero() {
  const t = useTranslations('home.hero');
  const tCommon = useTranslations('common');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#080427] to-background">
      <div className="container relative z-10 py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {t('title')}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl">
            {t('subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                {t('cta')}
              </Button>
            </Link>
            <Link href="/games">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {tCommon('learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
    </section>
  );
}


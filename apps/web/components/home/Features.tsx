'use client';

import { useTranslations } from 'next-intl';
import { Gamepad2, Video, Users } from 'lucide-react';

export function Features() {
  const t = useTranslations('home.features');

  const features = [
    {
      icon: Gamepad2,
      title: t('cloudGaming.title'),
      description: t('cloudGaming.description'),
    },
    {
      icon: Video,
      title: t('reels.title'),
      description: t('reels.description'),
    },
    {
      icon: Users,
      title: t('social.title'),
      description: t('social.description'),
    },
  ];

  return (
    <section className="container py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-4 rounded-lg border bg-card p-8"
              >
                <div className="rounded-full bg-primary/10 p-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


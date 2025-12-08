'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function PricingSection() {
  const t = useTranslations('home.pricing');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        'Access 2000+ Games',
        '1 - hour gaming session',
        'Up to 1080p resolution',
        'Up to 60Fps',
        'No priority access to queue',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      features: [
        'Access 4000+ Games',
        '6 - hour gaming session',
        'Up to 1440p resolution',
        'Up to 60Fps',
        'No priority access to queue',
      ],
      cta: 'Subscribe Now',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      period: '/month',
      features: [
        'Access 2000+ Games',
        '8 - hour gaming session',
        'Up to 4K resolution',
        'Up to 240Fps',
        'First priority access to queue',
      ],
      cta: 'Go Premium',
      popular: false,
    },
  ];

  return (
    <section className="relative w-full py-20 bg-[#080427] overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#1a1a3a]/30 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-5 md:px-20">
        {/* Section Header */}
        <div className="max-w-[1260px] mx-auto mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('sectionTitle')}
          </h2>
          <p className="text-lg text-gray-300 max-w-[768px] mx-auto">
            {t('sectionDescription')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-[1260px] mx-auto">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <span className="text-white text-sm">Popular</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white/5 backdrop-blur-sm rounded-lg p-8 border ${
                  plan.popular
                    ? 'border-white/30 scale-105 shadow-2xl'
                    : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-[#080427] text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-12 ${
                    plan.popular
                      ? 'bg-white text-[#080427] hover:bg-gray-200'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


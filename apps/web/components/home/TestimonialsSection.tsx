'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Quote } from 'lucide-react';

export function TestimonialsSection() {
  const t = useTranslations('home.testimonials');

  const testimonials = [
    {
      id: 1,
      name: 'Artemisia Udinese',
      role: 'Marketing Specialist',
      avatar: '/images/testimonial-1.jpg',
      text: 'As a long-time user of Strike, I can confidently say that their solutions have revolutionised the way we operate. From the outset, the team provided exceptional support and demonstrated a deep understanding of our needs. The innovative cloud gaming tools offered by Strike have significantly improved our workflow.',
    },
    {
      id: 2,
      name: 'Artemisia Udinese',
      role: 'Marketing Specialist',
      avatar: '/images/testimonial-2.jpg',
      text: 'As a long-time user of Strike, I can confidently say that their solutions have revolutionised the way we operate. From the outset, the team provided exceptional support and demonstrated a deep understanding of our needs. The innovative cloud gaming tools offered by Strike have significantly improved our workflow.',
    },
  ];

  return (
    <section className="relative w-full py-20 bg-[#080427] overflow-hidden">
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
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white text-sm ml-2">4.9/5 from 1,200+ reviews</p>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-10 border border-white/10"
              >
                <Quote className="w-12 h-12 text-white/20 mb-6" />
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
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


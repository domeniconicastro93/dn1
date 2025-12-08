import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { PricingSection } from '@/components/home/PricingSection';
import { ReelsSection } from '@/components/home/ReelsSection';
import { BlogSection } from '@/components/home/BlogSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Strike - Play Any Game. Anywhere. Instantly.',
  description:
    'No downloads. No waiting. Just pure gaming powered by cloud technology. Share your epic moments with TikTok-style Reels.',
};

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080427]">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <ReelsSection />
      <BlogSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}


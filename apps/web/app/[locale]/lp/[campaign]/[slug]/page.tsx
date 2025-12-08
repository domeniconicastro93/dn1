/**
 * Landing Page Template
 * 
 * Dynamic landing pages for SEM campaigns:
 * /lp/[locale]/[campaign]/[slug]
 * 
 * Example: /lp/en/cloud-gaming/play-gta-6-instantly
 */

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { generateSEOMetadata } from '@/lib/seo';
import { generateHreflangLinks } from '@/lib/hreflang';
import { generateLandingPageOGImageUrl } from '@/lib/og-image-generator';
import { generateVideoGameStructuredData } from '@/lib/seo';
import type { Metadata } from 'next';

interface LandingPageProps {
  params: Promise<{
    locale: string;
    campaign: string;
    slug: string;
  }>;
}

/**
 * Generate SEO metadata for landing page
 */
export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale, campaign, slug } = await params;

  // TODO: Fetch landing page content from CMS/campaign config
  // const landingPage = await fetchLandingPage({ locale, campaign, slug });

  // For Phase 7, use default content
  const gameName = slug.replace(/-/g, ' ');
  const title = `Play ${gameName} - Strike Gaming Cloud`;
  const description = `Play ${gameName} instantly in the cloud. No downloads. No waiting. Just pure gaming.`;

  const pathname = `/${locale}/lp/${campaign}/${slug}`;
  const hreflangLinks = generateHreflangLinks(pathname);

  // Generate dynamic OG image
  const ogImageUrl = generateLandingPageOGImageUrl({
    title,
    campaign,
    game: gameName,
  });

  return generateSEOMetadata(
    {
      title,
      description,
      locale,
      alternateLocales: hreflangLinks.map((link) => link.hreflang),
      ogImage: ogImageUrl,
      ogImageType: 'landing',
      ogImageData: {
        title,
        campaign,
        game: gameName,
      },
    },
    pathname
  );
}

/**
 * Landing Page Component
 */
export default async function LandingPage({ params }: LandingPageProps) {
  const { locale, campaign, slug } = await params;
  const t = await getTranslations('landing');

  // TODO: Fetch landing page content from CMS/campaign config
  // const landingPage = await fetchLandingPage({ locale, campaign, slug });
  // if (!landingPage) {
  //   notFound();
  // }

  // Generate structured data for landing page
  const gameName = slug.replace(/-/g, ' ');
  const pathname = `/${locale}/lp/${campaign}/${slug}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';
  const structuredData = generateVideoGameStructuredData({
    id: slug,
    name: gameName,
    description: t('hero.description'),
    platform: ['Cloud Gaming'],
    url: `${baseUrl}${pathname}`,
  });

  // For Phase 7, render default template
  return (
    <div className="min-h-screen bg-[#080427] text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {t('hero.title', { game: slug.replace(/-/g, ' ') })}
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          {t('hero.description')}
        </p>
        <div className="flex gap-4">
          <a
            href={`/${locale}/auth/register`}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            {t('cta.startPlaying')}
          </a>
          <a
            href={`/${locale}/games`}
            className="px-8 py-4 border border-gray-600 hover:border-gray-500 rounded-lg font-semibold"
          >
            {t('cta.browseGames')}
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">{t('features.title')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">{t('features.noDownload.title')}</h3>
            <p className="text-gray-300">{t('features.noDownload.description')}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">{t('features.instant.title')}</h3>
            <p className="text-gray-300">{t('features.instant.description')}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">{t('features.anywhere.title')}</h3>
            <p className="text-gray-300">{t('features.anywhere.description')}</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">{t('socialProof.title')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* TODO: Fetch testimonials from database */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <p className="mb-4">&quot;{t('socialProof.testimonial1')}&quot;</p>
            <p className="text-sm text-gray-400">- {t('socialProof.user1')}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <p className="mb-4">&quot;{t('socialProof.testimonial2')}&quot;</p>
            <p className="text-sm text-gray-400">- {t('socialProof.user2')}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <p className="mb-4">&quot;{t('socialProof.testimonial3')}&quot;</p>
            <p className="text-sm text-gray-400">- {t('socialProof.user3')}</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">{t('faq.title')}</h2>
        <div className="space-y-4">
          {/* TODO: Fetch FAQ from campaign config */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{t('faq.q1')}</h3>
            <p className="text-gray-300">{t('faq.a1')}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{t('faq.q2')}</h3>
            <p className="text-gray-300">{t('faq.a2')}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{t('faq.q3')}</h3>
            <p className="text-gray-300">{t('faq.a3')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl mb-8">{t('cta.description')}</p>
          <a
            href={`/${locale}/auth/register`}
            className="inline-block px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold"
          >
            {t('cta.getStarted')}
          </a>
        </div>
      </section>

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}


import { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import {
  generateGameOGImageUrl,
  generateClipOGImageUrl,
  generateCreatorOGImageUrl,
  generateLandingPageOGImageUrl,
} from './og-image-generator';

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  pathname?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  nofollow?: boolean;
  locale?: string;
  alternateLocales?: string[];
  // Dynamic OG image generation
  ogImageType?: 'game' | 'clip' | 'creator' | 'landing';
  ogImageData?: Record<string, unknown>;
}

/**
 * Generate complete SEO metadata for a page
 * Includes: title, description, canonical, hreflang, OG tags, Twitter cards
 */
export function generateSEOMetadata(
  config: SEOConfig,
  pathname: string = '/'
): Metadata {
  const {
    title,
    description,
    canonical,
    ogImage: providedOgImage,
    ogImageType,
    ogImageData,
    ogType = 'website',
    noindex = false,
    nofollow = false,
    locale = 'en',
    alternateLocales = routing.locales,
  } = config;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';
  const canonicalUrl = canonical || `${baseUrl}${pathname}`;

  // Generate dynamic OG image if type and data provided
  let ogImage = providedOgImage || '/og-image.jpg';
  if (ogImageType && ogImageData) {
    switch (ogImageType) {
      case 'game':
        ogImage = generateGameOGImageUrl(ogImageData as any);
        break;
      case 'clip':
        ogImage = generateClipOGImageUrl(ogImageData as any);
        break;
      case 'creator':
        ogImage = generateCreatorOGImageUrl(ogImageData as any);
        break;
      case 'landing':
        ogImage = generateLandingPageOGImageUrl(ogImageData as any);
        break;
    }
  }

  // Generate hreflang links for all supported locales
  const alternates: Record<string, string> = {};
  alternateLocales.forEach((loc) => {
    const localePath = loc === 'en' ? pathname : `/${loc}${pathname}`;
    alternates[`${loc}`] = `${baseUrl}${localePath}`;
  });

  return {
    title,
    description,
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    },
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      type: ogType,
      locale,
      url: canonicalUrl,
      title,
      description,
      siteName: 'Strike Gaming Cloud',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Generate structured data (JSON-LD) for VideoObject
 * 
 * Full VideoObject schema as per schema.org specification
 */
export function generateVideoObjectStructuredData(
  clip: {
    id: string;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    creator: {
      name: string;
      handle: string;
      url?: string;
    };
    game: {
      name: string;
      url?: string;
    };
    publishedAt: string;
    views?: number;
    likes?: number;
    language?: string;
  }
): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: clip.title,
    description: clip.description || clip.title,
    thumbnailUrl: clip.thumbnailUrl,
    uploadDate: clip.publishedAt,
    duration: `PT${clip.duration}S`,
    contentUrl: clip.videoUrl,
    embedUrl: clip.videoUrl,
    inLanguage: clip.language || 'en',
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WatchAction',
        userInteractionCount: clip.views || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: clip.likes || 0,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Strike Gaming Cloud',
      url: baseUrl,
    },
    creator: {
      '@type': 'Person',
      name: clip.creator.name,
      alternateName: clip.creator.handle,
      url: clip.creator.url || `${baseUrl}/creator/${clip.creator.handle}`,
    },
    about: {
      '@type': 'VideoGame',
      name: clip.game.name,
      url: clip.game.url || `${baseUrl}/games/${clip.game.name.toLowerCase().replace(/\s+/g, '-')}`,
    },
  };
}

/**
 * Generate structured data (JSON-LD) for VideoGame
 * 
 * Full VideoGame schema as per schema.org specification
 */
export function generateVideoGameStructuredData(
  game: {
    id: string;
    name: string;
    description: string;
    image?: string;
    genre?: string[];
    releaseDate?: string;
    developer?: string;
    publisher?: string;
    platform?: string[];
    rating?: {
      value: string;
      bestRating?: string;
      worstRating?: string;
    };
    url?: string;
  }
): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: game.description,
    image: game.image,
    genre: game.genre,
    datePublished: game.releaseDate,
    gamePlatform: game.platform || ['Cloud Gaming'],
    url: game.url || `${baseUrl}/games/${game.name.toLowerCase().replace(/\s+/g, '-')}`,
    publisher: game.publisher
      ? {
          '@type': 'Organization',
          name: game.publisher,
        }
      : undefined,
    developer: game.developer
      ? {
          '@type': 'Organization',
          name: game.developer,
        }
      : undefined,
    aggregateRating: game.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: game.rating.value,
          bestRating: game.rating.bestRating || '5',
          worstRating: game.rating.worstRating || '1',
        }
      : undefined,
  };
}

/**
 * Generate structured data (JSON-LD) for Person (Creator)
 * 
 * Full Person schema as per schema.org specification
 */
export function generatePersonStructuredData(
  creator: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
    bio?: string;
    url?: string;
    sameAs?: string[]; // Social media profiles
    jobTitle?: string;
  }
): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.name,
    alternateName: creator.handle,
    description: creator.bio,
    image: creator.avatarUrl,
    url: creator.url || `${baseUrl}/creator/${creator.handle}`,
    jobTitle: creator.jobTitle || 'Gaming Content Creator',
    sameAs: creator.sameAs || [],
  };
}

/**
 * Generate structured data (JSON-LD) for BroadcastEvent (Live Stream)
 * 
 * Full BroadcastEvent schema as per schema.org specification
 */
export function generateBroadcastEventStructuredData(
  stream: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    creator: {
      name: string;
      handle: string;
      url?: string;
    };
    game: {
      name: string;
      url?: string;
    };
    viewerCount?: number;
    language?: string;
  }
): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';

  return {
    '@context': 'https://schema.org',
    '@type': 'BroadcastEvent',
    name: stream.name,
    description: stream.description,
    startDate: stream.startDate,
    endDate: stream.endDate,
    inLanguage: stream.language || 'en',
    video: {
      '@type': 'VideoObject',
      contentUrl: stream.videoUrl,
      thumbnailUrl: stream.thumbnailUrl,
    },
    organizer: {
      '@type': 'Person',
      name: stream.creator.name,
      alternateName: stream.creator.handle,
      url: stream.creator.url || `${baseUrl}/creator/${stream.creator.handle}`,
    },
    about: {
      '@type': 'VideoGame',
      name: stream.game.name,
      url: stream.game.url || `${baseUrl}/games/${stream.game.name.toLowerCase().replace(/\s+/g, '-')}`,
    },
    audience: stream.viewerCount
      ? {
          '@type': 'Audience',
          audienceType: 'Gaming Community',
        }
      : undefined,
  };
}


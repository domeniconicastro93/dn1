/**
 * Hreflang Matrix Generator
 * 
 * Generates complete hreflang tags for all supported locales
 * following SEO best practices.
 */

import { routing } from '@/i18n/routing';

export interface HreflangLink {
  href: string;
  hreflang: string;
}

/**
 * Generate hreflang links for a given path
 * 
 * @param pathname - Path without locale prefix (e.g., '/games/gta-vi')
 * @param baseUrl - Base URL (default: https://strike.gg)
 * @returns Array of hreflang links for all supported locales
 */
export function generateHreflangLinks(
  pathname: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg'
): HreflangLink[] {
  const links: HreflangLink[] = [];

  // Add x-default (usually points to English)
  links.push({
    href: `${baseUrl}${pathname}`,
    hreflang: 'x-default',
  });

  // Add all supported locales
  for (const locale of routing.locales) {
    const localePath = locale === routing.defaultLocale
      ? pathname
      : `/${locale}${pathname}`;

    links.push({
      href: `${baseUrl}${localePath}`,
      hreflang: locale,
    });
  }

  return links;
}

/**
 * Generate hreflang links for a dynamic route with parameters
 * 
 * @param routePattern - Route pattern (e.g., '/games/[slug]')
 * @param params - Route parameters (e.g., { slug: 'gta-vi' })
 * @param baseUrl - Base URL
 * @returns Array of hreflang links
 */
export function generateHreflangLinksForRoute(
  routePattern: string,
  params: Record<string, string>,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg'
): HreflangLink[] {
  // Replace route parameters
  let pathname = routePattern;
  for (const [key, value] of Object.entries(params)) {
    pathname = pathname.replace(`[${key}]`, value);
  }

  return generateHreflangLinks(pathname, baseUrl);
}

/**
 * Convert hreflang links to Next.js Metadata alternates format
 */
export function hreflangLinksToAlternates(
  links: HreflangLink[]
): Record<string, string> {
  const alternates: Record<string, string> = {};

  for (const link of links) {
    alternates[link.hreflang] = link.href;
  }

  return alternates;
}


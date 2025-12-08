/**
 * Landing Pages Sitemap per Locale
 * 
 * Generates sitemap for landing pages in a specific locale
 */

import { MetadataRoute } from 'next';
import { generateLandingPagesSitemap } from './sitemap';

export default async function landingPagesSitemap({
  params,
}: {
  params: { locale: string };
}): Promise<MetadataRoute.Sitemap> {
  return generateLandingPagesSitemap(params.locale);
}


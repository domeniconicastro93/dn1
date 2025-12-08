/**
 * Clips/Reels Sitemap per Locale
 * 
 * Generates sitemap for clips/reels in a specific locale
 * Master Prompt Section 10: "sitemaps for clips/reels"
 */

import { MetadataRoute } from 'next';
import { generateClipsSitemap } from './sitemap';

export default async function clipsSitemap({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { locale } = await params;
  return generateClipsSitemap(locale);
}


/**
 * Games Sitemap per Locale
 * 
 * Generates sitemap for games in a specific locale
 */

import { MetadataRoute } from 'next';
import { generateGamesSitemap } from './sitemap';

export default async function gamesSitemap({
  params,
}: {
  params: { locale: string };
}): Promise<MetadataRoute.Sitemap> {
  return generateGamesSitemap(params.locale);
}


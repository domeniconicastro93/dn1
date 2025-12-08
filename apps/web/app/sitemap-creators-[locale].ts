/**
 * Creators Sitemap per Locale
 * 
 * Generates sitemap for creators in a specific locale
 */

import { MetadataRoute } from 'next';
import { generateCreatorsSitemap } from './sitemap';

export default async function creatorsSitemap({
  params,
}: {
  params: { locale: string };
}): Promise<MetadataRoute.Sitemap> {
  return generateCreatorsSitemap(params.locale);
}


/**
 * TTL Caching with Stale-While-Revalidate
 * 
 * Implements caching strategy as per Master Prompt:
 * - Public pages: 60-300s stale-while-revalidate
 * - Personalized content: no edge cache
 */

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  swr?: number; // Stale-while-revalidate in seconds
  tags?: string[]; // Cache tags for invalidation
}

/**
 * Get cache headers for a response
 */
export function getCacheHeaders(config: CacheConfig): HeadersInit {
  const headers: HeadersInit = {};

  // Cache-Control header
  const directives: string[] = [];

  if (config.swr) {
    // Stale-while-revalidate: serve stale content while revalidating
    directives.push(`s-maxage=${config.ttl}`);
    directives.push(`stale-while-revalidate=${config.swr}`);
  } else {
    directives.push(`s-maxage=${config.ttl}`);
  }

  // Public cache (CDN)
  directives.push('public');

  headers['Cache-Control'] = directives.join(', ');

  // Cache tags for invalidation (Vercel/Cloudflare)
  if (config.tags && config.tags.length > 0) {
    headers['Cache-Tags'] = config.tags.join(',');
  }

  return headers;
}

/**
 * Cache config for public pages (games, clips, creators)
 */
export function getPublicPageCacheConfig(): CacheConfig {
  return {
    ttl: 300, // 5 minutes
    swr: 600, // 10 minutes stale-while-revalidate
    tags: ['public'],
  };
}

/**
 * Cache config for landing pages
 */
export function getLandingPageCacheConfig(): CacheConfig {
  return {
    ttl: 300, // 5 minutes
    swr: 600, // 10 minutes stale-while-revalidate
    tags: ['landing-pages'],
  };
}

/**
 * Cache config for game catalog
 */
export function getGameCatalogCacheConfig(): CacheConfig {
  return {
    ttl: 300, // 5 minutes
    swr: 600, // 10 minutes stale-while-revalidate
    tags: ['games', 'catalog'],
  };
}

/**
 * Cache config for personalized content (no cache)
 */
export function getPersonalizedCacheConfig(): CacheConfig {
  return {
    ttl: 0, // No cache
    swr: 0,
    tags: [],
  };
}

/**
 * Revalidate cache by tag
 */
export async function revalidateCache(tag: string): Promise<void> {
  // TODO: In production, call revalidation API (Vercel/Cloudflare)
  // await fetch(`/api/revalidate?tag=${tag}`, { method: 'POST' });
  console.log(`[CACHE] Revalidating tag: ${tag}`);
}


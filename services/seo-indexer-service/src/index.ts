/**
 * SEO Indexer Service - Complete Implementation with Database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  sitemapQuerySchema,
  indexContentRequestSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  SitemapEntryDTO,
  SitemapIndexDTO,
  SEOIndexRequestDTO,
} from '@strike/shared-types';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'seo-indexer-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `seo:${clientId}`,
    RateLimitConfigs.PUBLIC_GET
  );

  if (!result.allowed) {
    reply.status(429).send(
      errorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.'
      )
    );
    return;
  }

  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
};

const BASE_URL = process.env.BASE_URL || 'https://strike.gg';
const SUPPORTED_LOCALES = ['en', 'it', 'fr', 'es', 'de', 'pt', 'ko', 'th', 'tr', 'pl', 'ar', 'id', 'vi', 'tl', 'ru', 'zh', 'ja'];

// GET /api/seo/v1/sitemap - Get sitemap index
app.get<{
  Querystring: {
    locale?: string;
  };
}>(
  '/api/seo/v1/sitemap',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate query params
      const validationResult = sitemapQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { locale } = validationResult.data;
      const targetLocale = locale || 'en';

      // Check cache
      const cached = await prisma.sitemapCache.findUnique({
        where: {
          sitemapType_locale: {
            sitemapType: 'index',
            locale: targetLocale,
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        return reply
          .header('Content-Type', 'application/xml')
          .status(200)
          .send(cached.content);
      }

      // Generate sitemap index (Master Prompt Section 10: main index, per language, games, creators, clips/reels)
      const sitemaps: SitemapEntryDTO[] = [];
      
      // Add sitemaps for each locale
      for (const loc of SUPPORTED_LOCALES) {
        sitemaps.push({
          loc: `${BASE_URL}/sitemap-games-${loc}.xml`,
          lastmod: new Date().toISOString(),
          hreflang: loc,
        });
        sitemaps.push({
          loc: `${BASE_URL}/sitemap-creators-${loc}.xml`,
          lastmod: new Date().toISOString(),
          hreflang: loc,
        });
        sitemaps.push({
          loc: `${BASE_URL}/sitemap-clips-${loc}.xml`,
          lastmod: new Date().toISOString(),
          hreflang: loc,
        });
        sitemaps.push({
          loc: `${BASE_URL}/sitemap-lp-${loc}.xml`,
          lastmod: new Date().toISOString(),
          hreflang: loc,
        });
      }

      const sitemapIndex: SitemapIndexDTO = {
        sitemaps,
      };

      // Cache sitemap
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

      await prisma.sitemapCache.upsert({
        where: {
          sitemapType_locale: {
            sitemapType: 'index',
            locale: targetLocale,
          },
        },
        create: {
          sitemapType: 'index',
          locale: targetLocale,
          content: JSON.stringify(sitemapIndex),
          lastGeneratedAt: new Date(),
          expiresAt,
        },
        update: {
          content: JSON.stringify(sitemapIndex),
          lastGeneratedAt: new Date(),
          expiresAt,
        },
      });

      return reply.status(200).send(successResponse(sitemapIndex));
    } catch (error) {
      app.log.error('Error generating sitemap index:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate sitemap index')
      );
    }
  }
);

// GET /api/seo/v1/sitemap/games - Get games sitemap
app.get<{
  Querystring: {
    locale?: string;
  };
}>(
  '/api/seo/v1/sitemap/games',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { locale } = request.query;
      const targetLocale = locale || 'en';

      // Check cache
      const cached = await prisma.sitemapCache.findUnique({
        where: {
          sitemapType_locale: {
            sitemapType: 'games',
            locale: targetLocale,
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        return reply
          .header('Content-Type', 'application/xml')
          .status(200)
          .send(cached.content);
      }

      // Fetch games from database
      const games = await prisma.game.findMany({
        where: {
          // Filter by featured or popular games
        },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });

      // Generate sitemap entries with hreflang
      const entries: SitemapEntryDTO[] = games.flatMap((game) =>
        SUPPORTED_LOCALES.map((loc) => ({
          loc: `${BASE_URL}/${loc}/games/${game.slug}`,
          lastmod: game.updatedAt.toISOString(),
          hreflang: loc,
          alternates: SUPPORTED_LOCALES.map((altLoc) => ({
            hreflang: altLoc,
            href: `${BASE_URL}/${altLoc}/games/${game.slug}`,
          })),
        }))
      );

      // Generate XML
      const xml = generateSitemapXML(entries);

      // Cache sitemap
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.sitemapCache.upsert({
        where: {
          sitemapType_locale: {
            sitemapType: 'games',
            locale: targetLocale,
          },
        },
        create: {
          sitemapType: 'games',
          locale: targetLocale,
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
        update: {
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
      });

      return reply
        .header('Content-Type', 'application/xml')
        .status(200)
        .send(xml);
    } catch (error) {
      app.log.error('Error generating games sitemap:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate games sitemap')
      );
    }
  }
);

// GET /api/seo/v1/sitemap/creators - Get creators sitemap
app.get<{
  Querystring: {
    locale?: string;
  };
}>(
  '/api/seo/v1/sitemap/creators',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { locale } = request.query;
      const targetLocale = locale || 'en';

      // Check cache
      const cached = await prisma.sitemapCache.findUnique({
        where: {
          sitemapType_locale: {
            sitemapType: 'creators',
            locale: targetLocale,
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        return reply
          .header('Content-Type', 'application/xml')
          .status(200)
          .send(cached.content);
      }

      // Fetch creators from database
      const creators = await prisma.creator.findMany({
        where: {
          followerCount: { gte: 100 }, // Only popular creators
        },
        take: 1000,
        orderBy: { followerCount: 'desc' },
      });

      // Generate sitemap entries
      const entries: SitemapEntryDTO[] = creators.flatMap((creator) =>
        SUPPORTED_LOCALES.map((loc) => ({
          loc: `${BASE_URL}/${loc}/creator/${creator.handle}`,
          lastmod: creator.updatedAt.toISOString(),
          hreflang: loc,
          alternates: SUPPORTED_LOCALES.map((altLoc) => ({
            hreflang: altLoc,
            href: `${BASE_URL}/${altLoc}/creator/${creator.handle}`,
          })),
        }))
      );

      // Generate XML
      const xml = generateSitemapXML(entries);

      // Cache sitemap
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.sitemapCache.upsert({
        where: {
          sitemapType_locale: {
            sitemapType: 'creators',
            locale: targetLocale,
          },
        },
        create: {
          sitemapType: 'creators',
          locale: targetLocale,
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
        update: {
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
      });

      return reply
        .header('Content-Type', 'application/xml')
        .status(200)
        .send(xml);
    } catch (error) {
      app.log.error('Error generating creators sitemap:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate creators sitemap')
      );
    }
  }
);

// GET /api/seo/v1/sitemap/clips - Get clips/reels sitemap (Master Prompt Section 10)
app.get<{
  Querystring: {
    locale?: string;
  };
}>(
  '/api/seo/v1/sitemap/clips',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { locale } = request.query;
      const targetLocale = locale || 'en';

      // Check cache
      const cached = await prisma.sitemapCache.findUnique({
        where: {
          sitemapType_locale: {
            sitemapType: 'clips',
            locale: targetLocale,
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        return reply
          .header('Content-Type', 'application/xml')
          .status(200)
          .send(cached.content);
      }

      // Fetch clips from database (published clips only)
      const clips = await prisma.clip.findMany({
        where: {
          status: 'published',
          ...(targetLocale && { language: targetLocale }),
        },
        take: 10000, // Limit to 10k clips per sitemap
        orderBy: { createdAt: 'desc' },
      });

      // Generate sitemap entries with hreflang
      const entries: SitemapEntryDTO[] = clips.flatMap((clip) =>
        SUPPORTED_LOCALES.map((loc) => ({
          loc: `${BASE_URL}/${loc}/clips/${clip.id}`,
          lastmod: clip.updatedAt.toISOString(),
          hreflang: loc,
          alternates: SUPPORTED_LOCALES.map((altLoc) => ({
            hreflang: altLoc,
            href: `${BASE_URL}/${altLoc}/clips/${clip.id}`,
          })),
        }))
      );

      // Generate XML
      const xml = generateSitemapXML(entries);

      // Cache sitemap
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.sitemapCache.upsert({
        where: {
          sitemapType_locale: {
            sitemapType: 'clips',
            locale: targetLocale,
          },
        },
        create: {
          sitemapType: 'clips',
          locale: targetLocale,
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
        update: {
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
      });

      return reply
        .header('Content-Type', 'application/xml')
        .status(200)
        .send(xml);
    } catch (error) {
      app.log.error('Error generating clips sitemap:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate clips sitemap')
      );
    }
  }
);

// GET /api/seo/v1/sitemap/landing-pages - Get landing pages sitemap
app.get<{
  Querystring: {
    locale?: string;
  };
}>(
  '/api/seo/v1/sitemap/landing-pages',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { locale } = request.query;
      const targetLocale = locale || 'en';

      // Check cache
      const cached = await prisma.sitemapCache.findUnique({
        where: {
          sitemapType_locale: {
            sitemapType: 'landing-pages',
            locale: targetLocale,
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        return reply
          .header('Content-Type', 'application/xml')
          .status(200)
          .send(cached.content);
      }

      // Get keyword clusters for landing pages
      const keywordClusters = await prisma.sEOKeywordCluster.findMany({
        where: { locale: targetLocale },
      });

      // Generate landing page entries
      const entries: SitemapEntryDTO[] = keywordClusters.flatMap((cluster) =>
        cluster.keywords.map((keyword) => ({
          loc: `${BASE_URL}/${targetLocale}/lp/${cluster.category}/${encodeURIComponent(keyword)}`,
          lastmod: cluster.updatedAt.toISOString(),
          hreflang: targetLocale,
        }))
      );

      // Generate XML
      const xml = generateSitemapXML(entries);

      // Cache sitemap
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.sitemapCache.upsert({
        where: {
          sitemapType_locale: {
            sitemapType: 'landing-pages',
            locale: targetLocale,
          },
        },
        create: {
          sitemapType: 'landing-pages',
          locale: targetLocale,
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
        update: {
          content: xml,
          lastGeneratedAt: new Date(),
          expiresAt,
        },
      });

      return reply
        .header('Content-Type', 'application/xml')
        .status(200)
        .send(xml);
    } catch (error) {
      app.log.error('Error generating landing pages sitemap:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate landing pages sitemap')
      );
    }
  }
);

// POST /api/seo/v1/index - Index content for SEO (internal)
app.post<{ Body: SEOIndexRequestDTO }>(
  '/api/seo/v1/index',
  {
    preHandler: [rateLimitMiddleware], // Internal service
  },
  async (request, reply) => {
    try {
      // Validate input
      const validationResult = indexContentRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { contentType, contentId, locale, metadata } = validationResult.data;

      // Invalidate relevant sitemap caches (Master Prompt Section 10: auto-refresh on content updates)
      const sitemapTypeMap: Record<string, string> = {
        'game': 'games',
        'creator': 'creators',
        'clip': 'clips',
        'reel': 'clips', // Reels are part of clips sitemap
        'landing-page': 'landing-pages',
      };
      
      const sitemapType = sitemapTypeMap[contentType] || 'index';
      
      await prisma.sitemapCache.updateMany({
        where: {
          sitemapType,
        },
        data: {
          expiresAt: new Date(), // Force regeneration
        },
      });

      // Emit SEOIndexed event
      await publishEvent(
        EventTopics.ANALYTICS,
        'SEOIndexed',
        {
          contentType,
          contentId,
          locale,
        },
        'seo-indexer-service'
      );

      return reply.status(202).send(
        successResponse({ message: 'Content indexed successfully' })
      );
    } catch (error) {
      app.log.error('Error indexing content:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to index content')
      );
    }
  }
);

// GET /api/seo/v1/keywords - Get keyword clusters
app.get<{
  Querystring: {
    locale?: string;
    category?: string;
  };
}>(
  '/api/seo/v1/keywords',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { locale, category } = request.query;

      // Build where clause
      const where: any = {};
      if (locale) {
        where.locale = locale;
      }
      if (category) {
        where.category = category;
      }

      // Fetch keyword clusters from database
      const clusters = await prisma.sEOKeywordCluster.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      const keywords = {
        locale: locale || 'en',
        clusters: clusters.map((cluster) => ({
          category: cluster.category,
          keywords: cluster.keywords,
        })),
      };

      return reply.status(200).send(successResponse(keywords));
    } catch (error) {
      app.log.error('Error fetching keywords:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch keywords')
      );
    }
  }
);

// Helper function to generate sitemap XML
function generateSitemapXML(entries: SitemapEntryDTO[]): string {
  const urlEntries = entries.map((entry) => {
    const alternates = entry.alternates?.map((alt) =>
      `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`
    ).join('\n') || '';

    return `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
${alternates}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
}

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  );
});

const PORT = parseInt(process.env.PORT || '3019', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`SEO indexer service listening on ${HOST}:${PORT}`);
});

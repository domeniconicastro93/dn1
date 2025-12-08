/**
 * Analytics Middleware
 * 
 * Tracks page views server-side for all routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { trackPageView } from '@/lib/analytics-server';

export async function analyticsMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Track page view (async, non-blocking)
  const pathname = request.nextUrl.pathname;

  // Skip tracking for:
  // - API routes
  // - Static assets
  // - Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return response;
  }

  // Extract userId from JWT if available
  const authHeader = request.headers.get('authorization');
  const userId = authHeader?.startsWith('Bearer ')
    ? undefined // TODO: Extract from JWT
    : undefined;

  // Track page view (fire and forget)
  trackPageView(pathname, userId, {
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    locale: request.nextUrl.locale || 'en',
  }).catch((error) => {
    console.error('[ANALYTICS] Error tracking page view:', error);
  });

  return response;
}


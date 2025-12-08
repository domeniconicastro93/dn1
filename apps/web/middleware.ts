import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { analyticsMiddleware } from './middleware-analytics';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Run i18n middleware first
  const response = intlMiddleware(request);

  // Then run analytics middleware
  return analyticsMiddleware(request, response);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};


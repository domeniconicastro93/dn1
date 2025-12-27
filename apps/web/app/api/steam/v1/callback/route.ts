import { NextRequest, NextResponse } from 'next/server';

/**
 * Steam OpenID Callback Route - PROXY ONLY
 * 
 * This route proxies to the Gateway which forwards to steam-library-service.
 * The actual callback logic is in steam-library-service for security.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  // Build Gateway URL with all query params
  const gatewayUrl = new URL('/api/steam/v1/callback', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  url.searchParams.forEach((value, key) => {
    gatewayUrl.searchParams.set(key, value);
  });

  console.log('[WEB CALLBACK PROXY] Forwarding to Gateway:', gatewayUrl.toString());

  // Forward all cookies
  const cookieHeader = request.headers.get('cookie');

  try {
    const response = await fetch(gatewayUrl.toString(), {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader || '',
        'User-Agent': request.headers.get('user-agent') || 'Strike-Web-Proxy'
      },
      redirect: 'manual' // Don't follow redirects, let the browser handle them
    });

    // If it's a redirect, forward it
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log('[WEB CALLBACK PROXY] Redirecting to:', location);
        return NextResponse.redirect(location);
      }
    }

    // Otherwise return the response as-is
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error: any) {
    console.error('[WEB CALLBACK PROXY] Error:', error.message);
    return NextResponse.redirect(new URL('/games?error=callback_proxy_failed', url.origin));
  }
}

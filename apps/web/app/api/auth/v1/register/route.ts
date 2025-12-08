import { NextRequest, NextResponse } from 'next/server';
import { registerAction } from '@/lib/server/auth-actions';

/**
 * POST /api/auth/register
 * 
 * Handles user registration using server action.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, locale, marketingConsent } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate locale format (should be 2 characters)
    const validLocale = locale && typeof locale === 'string' && locale.length === 2 ? locale : 'en';

    // Log request (only in development, without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Registration request received:', {
        email,
        locale: validLocale,
        marketingConsent: marketingConsent || false,
        hasPassword: !!password,
        passwordLength: password.length,
      });
    }

    const result = await registerAction(
      email,
      password,
      validLocale,
      marketingConsent || false
    );

    if (!result.success) {
      // Ensure error is always a string
      const errorMessage = result.error || 'Registration failed';

      // Enhanced error logging
      console.error('[API] Registration failed:', {
        email,
        error: errorMessage,
        result,
      });

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Log success (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Registration successful:', { email });
    }

    return NextResponse.json(result);
  } catch (error) {
    // Enhanced error logging
    let requestBodyInfo: any = 'Unable to parse request body';
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      requestBodyInfo = { email: body.email, hasPassword: !!body.password };
    } catch {
      // Ignore parsing errors
    }

    console.error('[API] Registration API route error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: requestBodyInfo,
    });

    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}


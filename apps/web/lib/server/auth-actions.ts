'use server';

import { redirect } from 'next/navigation';
import { setAccessToken, setRefreshToken, clearAuthCookies } from './strike-auth';
import type {
  RegisterRequestDTO,
  RegisterResponseDTO,
  LoginRequestDTO,
  LoginResponseDTO,
} from '@strike/shared-types';

// Get auth service URL - prefer AUTH_SERVICE_URL, fallback to gateway
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Log environment configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  if (!process.env.AUTH_SERVICE_URL && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[AUTH] AUTH_SERVICE_URL or NEXT_PUBLIC_API_URL not set, using default: http://localhost:3000');
  } else if (process.env.AUTH_SERVICE_URL) {
    console.log('[AUTH] Using AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
  } else {
    console.log('[AUTH] Using NEXT_PUBLIC_API_URL (gateway):', process.env.NEXT_PUBLIC_API_URL);
  }
}

interface AuthError {
  error: string;
  details?: unknown;
}

/**
 * Server action for user registration
 */
export async function registerAction(
  email: string,
  password: string,
  locale: string = 'en',
  marketingConsent: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestBody: RegisterRequestDTO = {
      email,
      password,
      locale,
      marketingConsent,
    };

    // Construct endpoint URL
    const endpoint = `${AUTH_SERVICE_URL}/api/auth/v1/register`;

    // Log request details (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Registration request:', {
        url: endpoint,
        method: 'POST',
        body: { ...requestBody, password: '***' }, // Don't log password
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => 'Unknown error');
      console.error('Failed to parse auth-service response:', {
        status: response.status,
        statusText: response.statusText,
        text,
      });
      return {
        success: false,
        error: `Auth service error: ${response.statusText || 'Unknown error'}`,
      };
    }

    if (!response.ok) {
      // Auth-service returns {error: {code, message, details?}}
      // Gateway might wrap it differently
      let errorMessage = 'Registration failed';

      if (data.error) {
        // Standard errorResponse format: {error: {code, message, details?}}
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.error.message) {
          errorMessage = data.error.message;
        } else if (data.error.code) {
          errorMessage = `Registration failed: ${data.error.code}`;
        }
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.code) {
        errorMessage = `Registration failed: ${data.code}`;
      }

      // Enhanced error logging
      console.error('[AUTH] Registration error:', {
        url: endpoint,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseBody: JSON.stringify(data, null, 2),
        extractedMessage: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = data.data as RegisterResponseDTO;

    // Store tokens in cookies
    await setAccessToken(result.accessToken);
    await setRefreshToken(result.refreshToken);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Server action for user login
 */
export async function loginAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestBody: LoginRequestDTO = {
      email,
      password,
    };

    // Construct endpoint URL
    const endpoint = `${AUTH_SERVICE_URL}/api/auth/v1/login`;

    // Log request details (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Login request:', {
        url: endpoint,
        method: 'POST',
        body: { email, password: '***' }, // Don't log password
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => 'Unknown error');
      console.error('Failed to parse auth-service response:', {
        status: response.status,
        statusText: response.statusText,
        text,
      });
      return {
        success: false,
        error: `Auth service error: ${response.statusText || 'Unknown error'}`,
      };
    }

    if (!response.ok) {
      // Auth-service returns {error: {code, message, details?}}
      // Gateway might wrap it differently
      let errorMessage = 'Login failed';

      if (data.error) {
        // Standard errorResponse format: {error: {code, message, details?}}
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.error.message) {
          errorMessage = data.error.message;
        } else if (data.error.code) {
          errorMessage = `Login failed: ${data.error.code}`;
        }
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.code) {
        errorMessage = `Login failed: ${data.code}`;
      }

      // Enhanced error logging
      console.error('[AUTH] Login error:', {
        url: endpoint,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseBody: JSON.stringify(data, null, 2),
        extractedMessage: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = data.data as LoginResponseDTO;

    // Store tokens in cookies
    await setAccessToken(result.accessToken);
    await setRefreshToken(result.refreshToken);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Server action for user logout
 */
export async function logoutAction() {
  await clearAuthCookies();
  redirect('/');
}


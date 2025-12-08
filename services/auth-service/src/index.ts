/**
 * Auth Service - Complete Implementation with Database
 * 
 * Handles user authentication, registration, password reset
 * Uses Prisma for database, Zod for validation, JWT for tokens
 */

import 'dotenv/config';
console.log("AUTH SERVICE STARTING DEBUG MODE ------------------------------------------------");
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  registerRequestSchema,
  loginRequestSchema,
  refreshTokenRequestSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
  verifyAccessToken,
  // extractTokenFromHeaderOrCookie, // REMOVED to avoid confusion
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  RegisterRequestDTO,
  RegisterResponseDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
} from '@strike/shared-types';
import { randomBytes } from 'crypto';

// Define local helper because import seems broken
function localExtractToken(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  cookieName: string = 'strike_access_token'
): string | null {
  // Try Authorization header first (preferred)
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fallback to cookie
  if (!token && cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie: string) => {
      const parts = cookie.trim().split('=');
      const key = parts[0];
      const value = parts.slice(1).join('=');
      acc[key] = value;
      return acc;
    }, {});
    token = cookies[cookieName] || null;
  }

  return token;
}

/**
 * OAuth Provider Interface (extensible)
 */
export interface OAuthProvider {
  provider: string;
  getAuthUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>;
  getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }>;
}

/**
 * OAuth Provider Registry
 */
class OAuthProviderRegistry {
  private providers: Map<string, OAuthProvider> = new Map();

  register(provider: OAuthProvider): void {
    this.providers.set(provider.provider, provider);
    // app.log.info(`[OAUTH] Registered provider: ${provider.provider}`);
  }

  get(provider: string): OAuthProvider | undefined {
    return this.providers.get(provider);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const oauthRegistry = new OAuthProviderRegistry();

const app = Fastify({
  logger: false, // DISABLED FOR DEBUGGING
});

// Register plugins
app.register(cookie);
app.register(cors as any, {
  origin: true,
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'auth-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `auth:${clientId}`,
    RateLimitConfigs.AUTHENTICATED
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

// POST /api/auth/v1/register
app.post<{ Body: RegisterRequestDTO }>(
  '/api/auth/v1/register',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const validationResult = registerRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { email, password, locale, marketingConsent } = validationResult.data;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(409).send(
          errorResponse(ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already registered')
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const referralCode = `ref_${randomBytes(8).toString('hex')}`;

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          locale: locale || 'en',
          marketingConsent: marketingConsent || false,
          referralCode,
        },
      });

      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        steamId64: user.steamId64 || undefined,
      });

      const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

      // Delete old refresh tokens for this user to avoid unique constraint errors
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: refreshTokenExpiresAt,
        },
      });

      await publishEvent(
        EventTopics.USERS,
        EventTypes.USER_CREATED,
        {
          userId: user.id,
          email: user.email,
          locale: user.locale,
        },
        'auth-service'
      );

      const response: RegisterResponseDTO = {
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };

      return reply.status(201).send(successResponse(response));
    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to register user')
      );
    }
  }
);

// POST /api/auth/v1/login
app.post<{ Body: LoginRequestDTO }>(
  '/api/auth/v1/login',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const validationResult = loginRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { email, password } = validationResult.data;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        console.log('[AUTH SERVICE] Login user found:', user.email, 'SteamID:', user.steamId64);
      }

      if (!user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password')
        );
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password')
        );
      }

      console.log('[AUTH SERVICE] Generating tokens for user:', user.id);
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        steamId64: user.steamId64 || undefined,
      });

      // PATCH: Manually regenerate access token to ensure steamId64 is included
      if (user.steamId64) {
        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';
        const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

        const payload = {
          userId: user.id,
          email: user.email,
          steamId64: user.steamId64
        };

        console.log('[AUTH SERVICE] PATCH: Regenerating token with payload:', JSON.stringify(payload));

        const newToken = jwt.sign(
          payload,
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );
        tokens.accessToken = newToken;
      }

      // DEBUG: Decode token to verify payload
      try {
        const debugPayload = JSON.parse(Buffer.from(tokens.accessToken.split('.')[1], 'base64').toString());
        console.log('[AUTH SERVICE] Generated token payload:', JSON.stringify(debugPayload));
      } catch (e) {
        console.error('[AUTH SERVICE] Failed to decode token for debug:', e);
      }

      const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

      // Delete old refresh tokens for this user to avoid unique constraint errors
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: refreshTokenExpiresAt,
        },
      });

      const response: LoginResponseDTO = {
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };

      // Set cookie
      reply.setCookie('strike_access_token', tokens.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      return reply.status(200).send(successResponse(response));
    } catch (error: any) {
      console.error('Login error:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, `Failed to login: ${error.message}`)
      );
    }
  }
);

// GET /api/auth/v1/session
app.get(
  '/api/auth/v1/session',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request: any, reply) => {
    try {
      console.log('[SESSION DEBUG] Endpoint called');

      // Extract token - wrap in try-catch for safety
      let token = null;
      try {
        token = localExtractToken(
          request.headers.authorization,
          request.headers.cookie,
          'strike_access_token'
        );
        console.log('[SESSION DEBUG] Token extracted:', !!token);
        if (token) console.log('[SESSION DEBUG] Token start:', token.substring(0, 20));
      } catch (extractError) {
        console.error('[SESSION DEBUG] Token extraction failed:', extractError);
        return reply.status(200).send(successResponse({ authenticated: false, user: null }));
      }

      if (!token) {
        console.log('[SESSION DEBUG] No token found');
        console.log('[SESSION DEBUG] Headers:', JSON.stringify(request.headers));
        return reply.status(200).send(successResponse({ authenticated: false, user: null }));
      }

      // Verify token
      let payload;
      try {
        payload = verifyAccessToken(token);
        console.log('[SESSION DEBUG] Token verified. Payload:', JSON.stringify(payload));
      } catch (verifyError) {
        console.error('[SESSION DEBUG] Token verification failed:', verifyError);
        return reply.status(200).send(successResponse({ authenticated: false, user: null }));
      }

      if (!payload) {
        console.log('[SESSION DEBUG] No payload');
        return reply.status(200).send(successResponse({ authenticated: false, user: null }));
      }

      // Fetch fresh user data from DB - wrap in try-catch
      try {
        console.log('[SESSION DEBUG] Fetching user from DB:', payload.userId);
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            steamId64: true,
          }
        });

        if (!dbUser) {
          console.log('[SESSION DEBUG] User not found in DB');
          return reply.status(200).send(successResponse({ authenticated: false, user: null }));
        }

        console.log('[SESSION DEBUG] User found:', dbUser.email);
        return reply.status(200).send(successResponse({ authenticated: true, user: dbUser }));
      } catch (dbError) {
        console.error('[SESSION DEBUG] Database error:', dbError);
        // If DB fails but token is valid, return unauthenticated instead of 500
        return reply.status(200).send(successResponse({ authenticated: false, user: null }));
      }
    } catch (error: any) {
      console.error('[SESSION DEBUG] Unexpected error:', error);
      // Return unauthenticated instead of 500 for better UX
      return reply.status(200).send(successResponse({ authenticated: false, user: null }));
    }
  }
);

// POST /api/auth/v1/refresh
app.post<{ Body: RefreshTokenRequestDTO }>(
  '/api/auth/v1/refresh',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const validationResult = refreshTokenRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { refreshToken } = validationResult.data;

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (error) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.INVALID_TOKEN, 'Invalid or expired refresh token')
        );
      }

      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.INVALID_TOKEN, 'Invalid or expired refresh token')
        );
      }

      const newAccessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        steamId64: tokenRecord.user.steamId64 || undefined,
      });

      const rotateRefreshToken = process.env.ROTATE_REFRESH_TOKENS === 'true';
      let newRefreshToken = refreshToken;

      if (rotateRefreshToken) {
        const newRefreshTokenExpiresAt = new Date();
        newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + 7);

        await prisma.refreshToken.delete({
          where: { token: refreshToken },
        });

        const newTokens = generateTokenPair({
          userId: payload.userId,
          email: payload.email,
          steamId64: tokenRecord.user.steamId64 || undefined,
        });
        newRefreshToken = newTokens.refreshToken;

        await prisma.refreshToken.create({
          data: {
            userId: payload.userId,
            token: newRefreshToken,
            expiresAt: newRefreshTokenExpiresAt,
          },
        });
      }

      const response: RefreshTokenResponseDTO = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      console.error('Token refresh error:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to refresh token')
      );
    }
  }
);

// POST /api/auth/v1/logout
app.post(
  '/api/auth/v1/logout',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const refreshToken = (request.body as { refreshToken?: string })?.refreshToken;

      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      // Clear cookie
      reply.clearCookie('strike_access_token', {
        path: '/',
      });

      return reply.status(200).send(successResponse({ success: true }));
    } catch (error) {
      console.error('Logout error:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to logout')
      );
    }
  }
);

// POST /api/auth/v1/password/forgot
app.post<{ Body: ForgotPasswordRequestDTO }>(
  '/api/auth/v1/password/forgot',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const validationResult = passwordResetRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { email } = validationResult.data;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(200).send(
          successResponse({
            message: 'If the email exists, a password reset link has been sent.',
          })
        );
      }

      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, used: false },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      await publishEvent(
        EventTopics.USERS,
        'PasswordResetRequested',
        {
          userId: user.id,
          email: user.email,
        },
        'auth-service'
      );

      return reply.status(200).send(
        successResponse({
          message: 'If the email exists, a password reset link has been sent.',
        })
      );
    } catch (error) {
      console.error('Password reset request error:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to process password reset request')
      );
    }
  }
);

// POST /api/auth/v1/password/reset
app.post<{ Body: ResetPasswordRequestDTO }>(
  '/api/auth/v1/password/reset',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const validationResult = passwordResetConfirmSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { token, newPassword } = validationResult.data;

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return reply.status(400).send(
          errorResponse(ErrorCodes.INVALID_TOKEN, 'Invalid or expired reset token')
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      await prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      });

      await publishEvent(
        EventTopics.USERS,
        'PasswordResetCompleted',
        {
          userId: resetToken.userId,
        },
        'auth-service'
      );

      return reply.status(200).send(
        successResponse({ message: 'Password reset successfully' })
      );
    } catch (error) {
      console.error('Password reset error:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to reset password')
      );
    }
  }
);

// Error handler
app.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  );
});

// OAuth endpoints (placeholder)
app.get<{ Params: { provider: string }; Querystring: { redirectUri?: string } }>(
  '/api/auth/v1/oauth/:provider/authorize',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { provider } = request.params;
      const oauthProvider = oauthRegistry.get(provider);
      if (!oauthProvider) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, `OAuth provider '${provider}' not found`)
        );
      }

      const state = randomBytes(32).toString('hex');
      const authUrl = oauthProvider.getAuthUrl(state);

      return reply.status(200).send(
        successResponse({
          authUrl,
          state,
          provider,
        })
      );
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to initiate OAuth flow')
      );
    }
  }
);

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Auth service listening on ${HOST}:${PORT}`);
});

/**
 * Steam Library Service - Complete Implementation
 * 
 * Handles Steam integration:
 * - OAuth Callback
 * - Owned Games Fetching (Live + Cache)
 * - Library Management
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  authMiddleware,
  optionalAuthMiddleware,
  verifyAccessToken,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import { steamService } from './steam-service';
import { STEAM_API_KEY } from './env';

// Validate Env
if (!STEAM_API_KEY) {
  console.error('FATAL: STEAM_WEB_API_KEY is not set!');
  process.exit(1);
}

const app = Fastify({
  logger: true,
});

// ---------------------
// Plugins
// ---------------------
app.register(cors as any, {
  origin: true,
  credentials: true,
});

app.register(cookie as any, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
});

// Rate limit disabled due to version mismatch in monorepo
// app.register(rateLimit as any, {
//   max: 100,
//   timeWindow: '1 minute',
// });

// ---------------------
// Steam Auth Routes
// ---------------------

// GET /api/auth (Initiate Steam Login)
app.get('/api/auth', async (request: any, reply) => {
  try {
    // Generate CSRF state token for validation on callback
    const crypto = await import('crypto');
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in cookie for validation (HttpOnly, Secure in production)
    reply.setCookie('steam_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build return URL with state parameter
    const baseReturnUrl = `${process.env.STEAM_LIBRARY_SERVICE_URL || 'http://localhost:3022'}/callback`;
    const returnUrl = `${baseReturnUrl}?state=${state}`;

    const steamOpenIdUrl = `https://steamcommunity.com/openid/login` +
      `?openid.ns=http://specs.openid.net/auth/2.0` +
      `&openid.mode=checkid_setup` +
      `&openid.return_to=${encodeURIComponent(returnUrl)}` +
      `&openid.realm=${encodeURIComponent(process.env.STEAM_REALM || 'http://localhost:3000')}` +
      `&openid.identity=http://specs.openid.net/auth/2.0/identifier_select` +
      `&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;

    app.log.info({ state }, '[SteamAuth] Initiating Steam OAuth with state');

    return reply.redirect(steamOpenIdUrl);
  } catch (error) {
    app.log.error({ error }, '[SteamAuth] Error initiating Steam auth');
    return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_init_error`);
  }
});

// GET /callback (Steam Return) - Enhanced with CSRF validation
app.get('/callback', async (request: any, reply) => {
  const startTime = Date.now();

  try {
    const params = request.query;
    const cookies = request.cookies;

    app.log.info('[SteamCallback] Received Steam callback');

    // 1. CSRF Validation - Check state parameter
    const receivedState = params.state;
    const storedState = cookies['steam_oauth_state'];

    if (!receivedState || !storedState || receivedState !== storedState) {
      app.log.error({
        receivedState,
        hasStoredState: !!storedState,
        statesMatch: receivedState === storedState
      }, '[SteamCallback] CSRF validation failed');

      // Clear the state cookie
      reply.clearCookie('steam_oauth_state');

      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_csrf_failed`);
    }

    // Clear the state cookie after successful validation
    reply.clearCookie('steam_oauth_state');

    // 2. Validate OpenID Response
    if (params['openid.mode'] !== 'id_res') {
      app.log.warn({ mode: params['openid.mode'] }, '[SteamCallback] User cancelled or invalid mode');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_cancel`);
    }

    // 3. Extract Steam ID from claimed_id
    const claimedId = params['openid.claimed_id'];
    if (!claimedId) {
      app.log.error('[SteamCallback] Missing openid.claimed_id');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_invalid`);
    }

    const steamId64 = claimedId.split('/').pop();
    if (!steamId64 || !/^\d{17}$/.test(steamId64)) {
      app.log.error({ claimedId, steamId64 }, '[SteamCallback] Invalid Steam ID format');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_invalid`);
    }

    app.log.info({ steamId64 }, '[SteamCallback] Extracted Steam ID');

    // 4. Identify User from JWT
    // The user must be logged in (JWT in cookie) to link their Steam account
    const token = cookies['strike_access_token'];

    if (!token) {
      app.log.error('[SteamCallback] No JWT token found in cookies');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/auth/login?error=steam_link_needs_login`);
    }

    let userId: string;
    let userEmail: string;

    try {
      const payload = verifyAccessToken(token);
      userId = payload.userId;
      userEmail = payload.email;
      app.log.info({ userId, userEmail }, '[SteamCallback] User identified from JWT');
    } catch (e: any) {
      app.log.error({ error: e.message }, '[SteamCallback] Invalid or expired JWT token');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/auth/login?error=steam_link_session_expired`);
    }

    // 5. Check if Steam ID is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        steamId64: steamId64,
        NOT: { id: userId }
      },
    });

    if (existingUser) {
      app.log.error({ steamId64, existingUserId: existingUser.id }, '[SteamCallback] Steam ID already linked to another account');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_already_linked`);
    }

    // 6. Update Database - Link Steam ID to user
    await prisma.user.update({
      where: { id: userId },
      data: { steamId64: steamId64 },
    });

    const elapsedMs = Date.now() - startTime;
    app.log.info({
      userId,
      userEmail,
      steamId64,
      elapsedMs
    }, '[SteamCallback] ✅ Successfully linked Steam account');

    // 7. Redirect to Frontend with success
    return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?steam=linked`);

  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    app.log.error({
      error: error.message,
      stack: error.stack,
      elapsedMs
    }, '[SteamCallback] 💥 Unexpected error during Steam callback');

    return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_server_error`);
  }
});

// ---------------------
// Protected Routes
// ---------------------

// GET /api/steam/owned-games
app.get(
  '/api/steam/owned-games',
  { preHandler: [authMiddleware as any] },
  async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      console.log('[Steam Library Service] === OWNED GAMES REQUEST ===');
      console.log('[Steam Library Service] User ID:', userId);

      const result = await steamService.getOwnedGamesForUser(userId);

      console.log('[Steam Library Service] Steam service result:', JSON.stringify(result, null, 2));
      console.log('[Steam Library Service] result.games length:', result.games?.length || 0);
      console.log('[Steam Library Service] result.privacyState:', result.privacyState);
      console.log('[Steam Library Service] result.error:', result.error);

      // Check if there's an error in the result
      if (result.error) {
        const errorMessages: Record<string, string> = {
          'STEAM_NOT_LINKED': 'Steam account not linked. Please connect your Steam account first.',
          'STEAM_FETCH_FAILED': 'Unable to fetch Steam library. Please try again later.',
        };

        const errorResponse = {
          games: [],
          privacyState: result.privacyState,
          error: {
            code: result.error,
            message: errorMessages[result.error] || result.errorMessage || 'Unknown error',
          }
        };

        console.log('[Steam Library Service] Returning error response:', JSON.stringify(errorResponse, null, 2));

        return reply.status(200).send(
          successResponse(errorResponse)
        );
      }

      console.log('[Steam Library Service] Returning success response');

      // PHASE 2.6 FIX: Normalize appid to steamAppId for frontend compatibility
      const normalizedGames = result.games.map((game: any) => ({
        ...game,
        steamAppId: game.appid, // Add steamAppId field
        appid: game.appid,      // Keep original for backward compatibility
      }));

      const normalizedResult = {
        ...result,
        games: normalizedGames,
      };

      console.log('[Steam Library Service] Normalized games with steamAppId field');
      console.log('[Steam Library Service] Sample game:', JSON.stringify(normalizedGames[0], null, 2));

      const finalResponse = successResponse(normalizedResult);
      console.log('[Steam Library Service] Final wrapped response:', JSON.stringify(finalResponse, null, 2));
      console.log('[Steam Library Service] === END ===');

      return reply.status(200).send(finalResponse);
    } catch (error: any) {
      console.error('[Steam Library Service] EXCEPTION:', error.message);
      console.error('[Steam Library Service] Stack:', error.stack);
      request.log.error({ error: error.message, stack: error.stack }, 'Failed to fetch Steam games');
      return reply.status(200).send(
        successResponse({
          games: [],
          privacyState: 'unknown',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred while fetching your Steam library',
            details: error?.message
          }
        })
      );
    }
  }
);

// Legacy route support
app.get(
  '/api/user/library',
  { preHandler: [authMiddleware as any] },
  async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      const result = await steamService.getOwnedGamesForUser(userId);

      // Check if there's an error in the result
      if (result.error) {
        const errorMessages: Record<string, string> = {
          'STEAM_NOT_LINKED': 'Steam account not linked. Please connect your Steam account first.',
          'STEAM_FETCH_FAILED': 'Unable to fetch Steam library. Please try again later.',
        };

        return reply.status(200).send(
          successResponse({
            games: [],
            privacyState: result.privacyState,
            error: {
              code: result.error,
              message: errorMessages[result.error] || result.errorMessage || 'Unknown error',
            }
          })
        );
      }

      return reply.status(200).send(successResponse(result));
    } catch (error: any) {
      request.log.error({ error: error.message, stack: error.stack }, 'Failed to fetch library');
      return reply.status(200).send(
        successResponse({
          games: [],
          privacyState: 'unknown',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred while fetching your Steam library',
            details: error?.message
          }
        })
      );
    }
  }
);

// ---------------------
// Startup
// ---------------------
const PORT = parseInt(process.env.PORT || '3022', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Steam Library Service listening on ${HOST}:${PORT}`);
});

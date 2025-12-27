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
// Health
// ---------------------
app.get('/health', async () => {
  return successResponse({ status: 'OK', service: 'steam-library-service' });
});

/**
 * Extract and validate Steam ID from OpenID claimed_id URL
 * 
 * @param claimedId - Full OpenID claimed_id URL
 * @returns 17-digit Steam ID or null if invalid
 * 
 * Example: https://steamcommunity.com/openid/id/76561198136376383
 * Returns: 76561198136376383
 */
function extractSteamId64(claimedId: string): string | null {
  if (!claimedId) {
    console.error('[extractSteamId64] ❌ Empty claimed_id provided');
    return null;
  }

  console.log('[extractSteamId64] Processing claimed_id:', '...' + claimedId.slice(-30));

  // Extract numeric ID from end of URL using regex
  // Matches 15-25 digit numbers at the end (Steam IDs are typically 17 digits)
  const match = claimedId.match(/\/(\d{15,25})$/);

  if (!match) {
    console.error('[extractSteamId64] ❌ No numeric ID found in URL');
    console.error('[extractSteamId64] Pattern expected: https://steamcommunity.com/openid/id/[digits]');
    return null;
  }

  const steamId64 = match[1];

  // Validate it's exactly 17 digits (standard Steam ID format)
  if (!/^\d{17}$/.test(steamId64)) {
    console.error('[extractSteamId64] ❌ Invalid Steam ID format');
    console.error('[extractSteamId64] Expected: 17 digits');
    console.error('[extractSteamId64] Got:', steamId64.length, 'digits');
    return null;
  }

  // Additional validation: Steam IDs start with specific prefixes
  // Most common: 765611... (64-bit representation)
  if (!steamId64.startsWith('7656')) {
    console.warn('[extractSteamId64] ⚠️ Unusual Steam ID prefix (expected 7656...)');
    console.warn('[extractSteamId64] Proceeding anyway - ID:', '...' + steamId64.slice(-4));
  }

  console.log('[extractSteamId64] ✅ VALID Steam ID extracted');
  console.log('[extractSteamId64] Last 4 digits:', '...' + steamId64.slice(-4));
  console.log('[extractSteamId64] Length:', steamId64.length, 'digits');

  return steamId64;
}

// ---------------------
// Routes
// ---------------------
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

    // 1. Extract session ID from state parameter
    const linkSessionId = params.state;

    if (!linkSessionId) {
      console.error('[SteamCallback] ❌ No state parameter (linkSessionId) received');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_invalid_state`);
    }

    // 2. Look up secure link session from DB
    console.log('[CALLBACK TRUTH] ==========================================');
    console.log('[CALLBACK TRUTH] Looking up SteamLinkSession...');
    console.log('[CALLBACK TRUTH] linkSessionId =', linkSessionId);

    const linkSession = await prisma.steamLinkSession.findUnique({
      where: { id: linkSessionId },
      include: { user: { select: { id: true, email: true, steamId64: true } } }
    });

    if (!linkSession) {
      console.error('[SteamCallback] ❌ Link session not found or expired');
      console.error('[SteamCallback] linkSessionId =', linkSessionId);
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_session_expired`);
    }

    // 3. Validate session not expired
    if (linkSession.expiresAt < new Date()) {
      console.error('[SteamCallback] ❌ Link session expired');
      console.error('[SteamCallback] expiresAt =', linkSession.expiresAt.toISOString());
      await prisma.steamLinkSession.delete({ where: { id: linkSessionId } });
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_session_expired`);
    }

    // 4. Extract userId from session (SECURE & DETERMINISTIC)
    const userId = linkSession.userId;

    console.log('[CALLBACK TRUTH] ✅ Link session found and valid');
    console.log('[CALLBACK TRUTH] userId from DB =', userId);
    console.log('[CALLBACK TRUTH] user email =', linkSession.user.email);
    console.log('[CALLBACK TRUTH] current steamId64 =', linkSession.user.steamId64 || 'NULL');
    console.log('[CALLBACK TRUTH] SECURE: One-time session prevents CSRF');
    console.log('[CALLBACK TRUTH] ==========================================');

    // 2. Validate OpenID Response
    if (params['openid.mode'] !== 'id_res') {
      app.log.warn({ mode: params['openid.mode'] }, '[SteamCallback] User cancelled or invalid mode');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_cancel`);
    }


    // 3. Extract Steam ID from claimed_id using robust extraction function
    const claimedId = params['openid.claimed_id'];
    if (!claimedId) {
      console.error('[SteamCallback] ❌ Missing openid.claimed_id parameter');
      app.log.error('[SteamCallback] Missing openid.claimed_id');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_invalid`);
    }

    console.log('[SteamCallback] 📋 Calling extractSteamId64...');
    const steamId64 = extractSteamId64(claimedId);

    if (!steamId64) {
      console.error('[SteamCallback] ❌ Failed to extract valid Steam ID from claimed_id');
      app.log.error({ claimedId: '...' + claimedId.slice(-20) }, '[SteamCallback] Steam ID extraction failed');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_invalid`);
    }

    console.log('[SteamCallback] 🔑 STEAMID64 EXTRACTED:', '...' + steamId64.slice(-4));

    // User already verified from linkSession above
    console.log('[SteamCallback] 👤 USER_ID (from link session):', userId);

    // 5. Check if Steam ID is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        steamId64: steamId64,
        NOT: { id: userId }
      },
    });

    if (existingUser) {
      console.log('[SteamCallback] ⚠️ STEAMID ALREADY LINKED to user:', existingUser.id);
      app.log.error({ steamId64: '...' + steamId64.slice(-4), existingUserId: existingUser.id }, '[SteamCallback] Steam ID already linked to another account');
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/games?error=steam_already_linked`);
    }

    // 6. Update Database - Link Steam ID to user
    console.log('[SteamCallback] 💾 UPDATING DATABASE...');
    console.log('[SteamCallback] 💾 WHERE: userId =', userId);
    console.log('[SteamCallback] 💾 SET: steamId64 =', steamId64);

    const updateResult = await prisma.user.update({
      where: { id: userId },
      data: { steamId64: steamId64 },
    });

    console.log('[SteamCallback] ✅ DB UPDATE SUCCESSFUL');
    console.log('[SteamCallback] ✅ UPDATED USER:', updateResult.id);
    console.log('[SteamCallback] ✅ CONFIRMED STEAMID64:', updateResult.steamId64);

    // Verify the update worked
    const verifyUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamId64: true }
    });
    console.log('[SteamCallback] 🔍 VERIFICATION: DB contains steamId64 =', verifyUser?.steamId64);

    const elapsedMs = Date.now() - startTime;
    app.log.info({
      userId,
      steamId64: '...' + steamId64.slice(-4),
      elapsedMs
    }, '[SteamCallback] ✅ Successfully linked Steam account');

    // 7. Delete one-time link session (security cleanup)
    await prisma.steamLinkSession.delete({ where: { id: linkSessionId } });
    console.log('[SteamCallback] 🗑️ Deleted one-time link session');

    // 8. Redirect to Frontend with success
    const redirectPath = linkSession.redirect || '/games';
    return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}${redirectPath}?steam=linked`);

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
      console.log('[Steam Library Service] CorrelationID:', request.headers['x-correlation-id']);
      console.log('[Steam Library Service] User ID:', userId);

      // Diagnostic DB check
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { steamId64: true } });
      console.log('[Steam Library Service] DB Lookup SteamID64:', dbUser?.steamId64 ? `...${dbUser.steamId64.slice(-4)}` : 'NULL');

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

// GET /api/steam/debug/verify-steamid - Verify steamId64 in DB
app.get(
  '/api/steam/debug/verify-steamid',
  { preHandler: [authMiddleware as any] },
  async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      console.log('[DEBUG verify-steamid] Checking for userId:', userId);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, steamId64: true }
      });

      if (!user) {
        console.log('[DEBUG verify-steamid] User not found');
        return reply.status(404).send(errorResponse(ErrorCodes.NOT_FOUND, 'User not found'));
      }

      const result = {
        userId: user.id,
        email: user.email,
        steamId64_last4: user.steamId64 ? '...' + user.steamId64.slice(-4) : null,
        steamId64_exists: !!user.steamId64,
        steamId64_full: user.steamId64 // Include full for debugging (will be logged)
      };

      console.log('[DEBUG verify-steamid] Result:', {
        ...result,
        steamId64_full: result.steamId64_full ? '...' + result.steamId64_full.slice(-6) : null
      });

      return successResponse({
        userId: result.userId,
        email: result.email,
        steamId64_last4: result.steamId64_last4,
        steamId64_exists: result.steamId64_exists
      });
    } catch (error: any) {
      console.error('[DEBUG verify-steamid] Error:', error.message);
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, error.message));
    }
  }
);

// GET /api/steam/debug/me-steam - Diagnostic endpoint
app.get(
  '/api/steam/debug/me-steam',
  { preHandler: [authMiddleware as any] },
  async (request: any, reply) => {
    try {
      const userId = request.user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, steamId64: true }
      });

      return successResponse({
        userId: user?.id,
        steamId64_last4: user?.steamId64 ? `...${user.steamId64.slice(-4)}` : null,
        steamId64_exists: !!user?.steamId64
      });
    } catch (error: any) {
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, error.message));
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

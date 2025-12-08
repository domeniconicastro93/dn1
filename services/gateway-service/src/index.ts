/**
 * Gateway Service - Complete Implementation with JWT Validation
 * 
 * Central entry point for all API requests with:
 * - JWT authentication validation
 * - Rate limiting
 * - Geo rules enforcement
 * - Request routing to microservices
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import httpProxy from '@fastify/http-proxy';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  verifyAccessToken,
  optionalAuthMiddleware,
} from '@strike/shared-utils';
import type { AuthenticatedRequest } from '@strike/shared-utils';
// Use local token extraction to avoid import issues
import { extractTokenFromHeaderOrCookie } from './token-utils';

const app = Fastify({
  logger: {
    level: 'info',
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        correlationId: (req as any).correlationId,
        ip: req.ip,
      }),
    },
  },
  requestIdHeader: 'x-correlation-id',
  requestIdLogLabel: 'correlationId',
  genReqId: () => randomUUID(),
});

// ---------------------
// CORS
// ---------------------
app.register(cors as any, {
  origin: true,
  credentials: true,
});

// GLOBAL REQUEST LOGGER
app.addHook('onRequest', async (request, reply) => {
  console.log('[GATEWAY] ========================================');
  console.log('[GATEWAY] Incoming Request');
  console.log('[GATEWAY] Method:', request.method);
  console.log('[GATEWAY] URL:', request.url);
  console.log('[GATEWAY] Headers:', JSON.stringify(request.headers, null, 2));
  console.log('[GATEWAY] ========================================');
});

// GLOBAL ERROR HANDLER
app.setErrorHandler((error, request, reply) => {
  console.error('[GATEWAY] ========================================');
  console.error('[GATEWAY] ERROR CAUGHT');
  console.error('[GATEWAY] URL:', request.url);
  console.error('[GATEWAY] Error:', error);
  console.error('[GATEWAY] Stack:', error.stack);
  console.error('[GATEWAY] ========================================');

  reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      details: error.stack,
    },
  });
});

// ---------------------
// Global Rate Limit
// ---------------------
app.register(rateLimit as any, {
  max: 100,
  timeWindow: '1 minute',
});

// ---------------------
// Correlation ID
// ---------------------
app.addHook('onRequest', async (request, reply) => {
  const correlationId =
    (request.headers['x-correlation-id'] as string) ||
    (request.id as string) ||
    randomUUID();

  (request as any).correlationId = correlationId;
  reply.header('X-Correlation-ID', correlationId);

  app.log.info({
    correlationId,
    method: request.method,
    url: request.url,
    ip: request.ip,
  }, 'Incoming request');
});

// Remove Expect header
app.addHook('onRequest', async (request) => {
  if (request.headers.expect) {
    delete request.headers.expect;
  }
});

// ---------------------
// Health Check
// ---------------------
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'gateway-service' });
});

// ---------------------
// JWT Middleware (Enhanced with comprehensive logging)
// ---------------------
const jwtValidationMiddleware = async (request: AuthenticatedRequest, reply: any) => {
  const DEBUG_JWT = process.env.DEBUG_JWT === 'true';
  const correlationId = (request as any).correlationId || 'unknown';

  console.log(`[JWT Gateway] === START JWT VALIDATION ===`);
  console.log(`[JWT Gateway] Correlation ID: ${correlationId}`);
  console.log(`[JWT Gateway] URL: ${request.url}`);
  console.log(`[JWT Gateway] Method: ${request.method}`);

  // Use the unified token extraction utility with error handling
  let token: string | null = null;
  try {
    console.log(`[JWT Gateway] Attempting token extraction...`);
    console.log(`[JWT Gateway] Has Authorization header: ${!!request.headers.authorization}`);
    console.log(`[JWT Gateway] Has Cookie header: ${!!request.headers.cookie}`);

    token = extractTokenFromHeaderOrCookie(
      request.headers.authorization,
      request.headers.cookie,
      'strike_access_token'
    );

    console.log(`[JWT Gateway] Token extraction result: ${!!token}`);
    if (token) {
      console.log(`[JWT Gateway] Token starts with: ${token.substring(0, 20)}...`);
    }
  } catch (extractError: any) {
    console.error(`[JWT Gateway] ERROR during token extraction:`, extractError.message);
    console.error(`[JWT Gateway] Error stack:`, extractError.stack);
    app.log.error({ correlationId, error: extractError.message }, '[JWT] Token extraction failed');
    return reply.status(500).send(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Token extraction error')
    );
  }

  if (!token) {
    console.log(`[JWT Gateway] No token found - returning 401`);
    app.log.warn({ correlationId }, '[JWT] No token found in request');
    return reply.status(401).send(
      errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    );
  }

  try {
    console.log(`[JWT Gateway] Verifying token...`);
    const payload = verifyAccessToken(token);

    if (!payload) {
      console.log(`[JWT Gateway] Token verification returned null`);
      app.log.warn({ correlationId }, '[JWT] Token verification returned null');
      return reply.status(401).send(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token')
      );
    }

    console.log(`[JWT Gateway] Token verified successfully`);
    console.log(`[JWT Gateway] User ID: ${payload.userId}`);
    console.log(`[JWT Gateway] Email: ${payload.email}`);
    console.log(`[JWT Gateway] Steam ID: ${payload.steamId64 || 'none'}`);

    // Attach user to request
    request.user = {
      userId: payload.userId,
      email: payload.email,
      steamId64: payload.steamId64,
    };

    // IMPORTANT: Ensure Authorization header is set for downstream services
    // This ensures proxied requests have the token available
    if (!request.headers.authorization) {
      request.headers.authorization = `Bearer ${token}`;
      console.log(`[JWT Gateway] Added Authorization header for downstream`);
    }

    console.log(`[JWT Gateway] === JWT VALIDATION SUCCESS ===`);
  } catch (error: any) {
    console.error(`[JWT Gateway] ERROR during token verification:`, error.message);
    console.error(`[JWT Gateway] Error stack:`, error.stack);
    app.log.error({ correlationId, error: error.message }, '[JWT] Token verification failed');
    return reply.status(401).send(
      errorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid token')
    );
  }
};

// ---------------------
// GEO Rules Middleware
// ---------------------
const geoRulesMiddleware = async (request: any, reply: any) => {
  const country = request.headers['cf-ipcountry'] ||
    request.headers['x-country-code'] ||
    'unknown';

  if (country === 'RU' && request.url?.includes('/api/payments/v1')) {
    return reply.status(403).send(
      errorResponse(ErrorCodes.GEO_BLOCKED, 'Payments from this region are not allowed')
    );
  }
};

// ---------------------
// AUTH SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  prefix: '/api/auth/v1',
  rewritePrefix: '/api/auth/v1',
  http2: false,
  replyOptions: {
    rewriteRequestHeaders: (originalReq: any, headers: any) => {
      return {
        ...headers,
        authorization: originalReq.headers.authorization,
        cookie: originalReq.headers.cookie,
        'x-correlation-id': (originalReq as any).correlationId
      };
    }
  }
});

// ---------------------
// USER SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  prefix: '/api/user/v1',
  rewritePrefix: '/api/user/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// ---------------------
// GAME SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.GAME_SERVICE_URL || 'http://localhost:3003',
  prefix: '/api/game/v1',
  rewritePrefix: '/api/game/v1',
});

// ---------------------
// SESSION SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.SESSION_SERVICE_URL || 'http://localhost:3004',
  prefix: '/api/session/v1',
  rewritePrefix: '/api/session/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// ---------------------
// REPLAY ENGINE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.REPLAY_SERVICE_URL || 'http://localhost:3005',
  prefix: '/api/replay/v1',
  rewritePrefix: '/api/replay/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// ---------------------
// EDITING SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.EDITING_SERVICE_URL || 'http://localhost:3006',
  prefix: '/api/editing/v1',
  rewritePrefix: '/api/editing/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// ---------------------
// CLIP SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.CLIP_SERVICE_URL || 'http://localhost:3007',
  prefix: '/api/clips/v1',
  rewritePrefix: '/api/clips/v1',
  preHandler: [optionalAuthMiddleware as any],
});

// ---------------------
// FEED SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.FEED_SERVICE_URL || 'http://localhost:3008',
  prefix: '/api/feed/v1',
  rewritePrefix: '/api/feed/v1',
  preHandler: [optionalAuthMiddleware as any],
});

// ---------------------
// PAYMENTS SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3009',
  prefix: '/api/payments/v1',
  rewritePrefix: '/api/payments/v1',
  preHandler: [jwtValidationMiddleware as any, geoRulesMiddleware as any],
});

// ---------------------
// WALLET SERVICE
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.WALLET_SERVICE_URL || 'http://localhost:3010',
  prefix: '/api/wallet/v1',
  rewritePrefix: '/api/wallet/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// ---------------------
// ANALYTICS
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011',
  prefix: '/api/analytics/v1',
  rewritePrefix: '/api/analytics/v1',
});

// ---------------------
// ORCHESTRATOR
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012',
  prefix: '/api/orchestrator/v1',
  rewritePrefix: '/api/orchestrator/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// ---------------------
// STEAM LIBRARY SERVICE — COMPLETE ROUTING
// ---------------------

// 1) Steam callback (no auth) - Steam redirects here after OpenID auth
app.register(httpProxy as any, {
  upstream: process.env.STEAM_LIBRARY_SERVICE_URL || "http://localhost:3022",
  prefix: "/api/steam/v1/callback",
  rewritePrefix: "/callback",
  http2: false,
  // Ensure cookies are forwarded for user identification
  replyOptions: {
    rewriteRequestHeaders: (originalReq: any, headers: any) => {
      return {
        ...headers,
        'x-forwarded-for': originalReq.ip,
        'x-forwarded-proto': originalReq.protocol,
        'x-forwarded-host': originalReq.hostname,
      };
    },
  },
});

// 2) Steam Auth Initiation (no auth required) - Redirects user to Steam OpenID
app.register(httpProxy as any, {
  upstream: process.env.STEAM_LIBRARY_SERVICE_URL || "http://localhost:3022",
  prefix: "/api/steam/v1/auth",
  rewritePrefix: "/api/auth",
  http2: false,
});

// 3) Steam owned-games endpoint (protected) - Returns user's Steam library
app.register(httpProxy as any, {
  upstream: process.env.STEAM_LIBRARY_SERVICE_URL || "http://localhost:3022",
  prefix: "/api/steam/v1/owned-games",
  rewritePrefix: "/api/steam/owned-games",
  preHandler: [jwtValidationMiddleware as any],
  http2: false,
  // Ensure Authorization header is forwarded
  replyOptions: {
    rewriteRequestHeaders: (originalReq: any, headers: any) => {
      const forwardHeaders = { ...headers };

      // Ensure Authorization is forwarded
      if (originalReq.headers.authorization) {
        forwardHeaders.authorization = originalReq.headers.authorization;
      }

      // Forward correlation ID
      if ((originalReq as any).correlationId) {
        forwardHeaders['x-correlation-id'] = (originalReq as any).correlationId;
      }

      return forwardHeaders;
    },
  },
});

// 4) Legacy library endpoint (for backwards compatibility)
app.register(httpProxy as any, {
  upstream: process.env.STEAM_LIBRARY_SERVICE_URL || "http://localhost:3022",
  prefix: "/api/steam/v1/library",
  rewritePrefix: "/api/user/library",
  preHandler: [jwtValidationMiddleware as any],
  http2: false,
});

// 5) Catch-all steam routes (protected)
// This handles any other /api/steam/v1/* requests not matched above
app.register(httpProxy as any, {
  upstream: process.env.STEAM_LIBRARY_SERVICE_URL || "http://localhost:3022",
  prefix: "/api/steam/v1",
  rewritePrefix: "/api",
  preHandler: [jwtValidationMiddleware as any],
  http2: false,
});

// ---------------------
// Other services…
// ---------------------

app.register(httpProxy as any, {
  upstream: process.env.MODERATION_SERVICE_URL || 'http://localhost:3013',
  prefix: '/api/moderation/v1',
  rewritePrefix: '/api/moderation/v1',
});

app.register(httpProxy as any, {
  upstream: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3016',
  prefix: '/api/community/v1',
  rewritePrefix: '/api/community/v1',
  preHandler: [optionalAuthMiddleware as any],
});

app.register(httpProxy as any, {
  upstream: process.env.CHAT_SERVICE_URL || 'http://localhost:3017',
  prefix: '/api/chat/v1',
  rewritePrefix: '/api/chat/v1',
  preHandler: [jwtValidationMiddleware as any],
});

app.register(httpProxy as any, {
  upstream: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3018',
  prefix: '/api/notification/v1',
  rewritePrefix: '/api/notification/v1',
  preHandler: [jwtValidationMiddleware as any],
});

// DETAILED PROXY LOGGING FOR /api/play
app.addHook('preHandler', async (request, reply) => {
  if (request.url.startsWith('/api/play')) {
    console.log('[GATEWAY PROXY] ========================================');
    console.log('[GATEWAY PROXY] Proxying to Orchestrator');
    console.log('[GATEWAY PROXY] Original URL:', request.url);
    console.log('[GATEWAY PROXY] Method:', request.method);
    console.log('[GATEWAY PROXY] Target:', process.env.ORCHESTRATOR_SERVICE_URL || 'http://127.0.0.1:3012');
    console.log('[GATEWAY PROXY] Rewrite to:', request.url.replace('/api/play', '/api/orchestrator/v1/session'));
    console.log('[GATEWAY PROXY] ========================================');
  }
});

// ---------------------
// PLAY/SESSION SERVICE (Orchestrator)
// ---------------------
app.register(httpProxy as any, {
  upstream: process.env.ORCHESTRATOR_SERVICE_URL || 'http://127.0.0.1:3012',
  prefix: '/api/play',
  rewritePrefix: '/api/orchestrator/v1/session',
  preHandler: [jwtValidationMiddleware as any],
  http2: false,
});

app.register(httpProxy as any, {
  upstream: process.env.SEO_SERVICE_URL || 'http://localhost:3019',
  prefix: '/api/seo/v1',
  rewritePrefix: '/api/seo/v1',
});

// ---------------------
// Error Handler
// ---------------------
app.setErrorHandler((error, request, reply) => {
  const correlationId = (request as any).correlationId || request.id || 'unknown';
  app.log.error({
    correlationId,
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    statusCode: error.statusCode,
  }, 'Request error');

  if ((error as any).code === 'ECONNREFUSED') {
    return reply.status(503).send(
      errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, 'Upstream service unavailable')
    );
  }

  reply.status(error.statusCode || 500).send(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  );
});

// ---------------------
// Startup
// ---------------------
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Gateway service listening on ${HOST}:${PORT}`);
});

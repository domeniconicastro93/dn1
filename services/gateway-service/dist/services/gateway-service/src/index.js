"use strict";
/**
 * Gateway Service - Complete Implementation with JWT Validation
 *
 * Central entry point for all API requests with:
 * - JWT authentication validation
 * - Rate limiting
 * - Geo rules enforcement
 * - Request routing to microservices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const http_proxy_1 = __importDefault(require("@fastify/http-proxy"));
const crypto_1 = require("crypto");
const shared_utils_1 = require("@strike/shared-utils");
const app = (0, fastify_1.default)({
    logger: {
        level: 'info',
        serializers: {
            req: (req) => ({
                method: req.method,
                url: req.url,
                correlationId: req.correlationId,
                ip: req.ip,
            }),
        },
    },
    requestIdHeader: 'x-correlation-id',
    requestIdLogLabel: 'correlationId',
    genReqId: () => (0, crypto_1.randomUUID)(),
});
// CORS
// Register plugins
app.register(cors_1.default, {
    origin: true,
    credentials: true,
});
// Global rate limiting
app.register(rate_limit_1.default, {
    max: 100,
    timeWindow: '1 minute',
});
// Correlation ID middleware - attach to all requests
app.addHook('onRequest', async (request, reply) => {
    // Get or generate correlation ID
    const correlationId = request.headers['x-correlation-id'] ||
        request.id ||
        (0, crypto_1.randomUUID)();
    // Attach to request for logging
    request.correlationId = correlationId;
    // Add to response headers
    reply.header('X-Correlation-ID', correlationId);
    // Log request with correlation ID
    app.log.info({
        correlationId,
        method: request.method,
        url: request.url,
        ip: request.ip,
    }, 'Incoming request');
});
// Remove Expect header to avoid issues with fastify-reply-from
app.addHook('onRequest', async (request) => {
    if (request.headers.expect) {
        delete request.headers.expect;
    }
});
// Health check
app.get('/health', async () => {
    return (0, shared_utils_1.successResponse)({ status: 'ok', service: 'gateway-service' });
});
// JWT validation middleware for protected routes
const jwtValidationMiddleware = async (request, reply) => {
    const token = (0, shared_utils_1.extractTokenFromHeader)(request.headers.authorization);
    if (!token) {
        return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'Authentication required'));
    }
    try {
        const payload = (0, shared_utils_1.verifyAccessToken)(token);
        if (!payload) {
            return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'));
        }
        // Attach user info to request
        request.user = {
            userId: payload.userId,
            email: payload.email,
        };
    }
    catch (error) {
        return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'Invalid token'));
    }
};
// Geo rules middleware (block RU payments)
const geoRulesMiddleware = async (request, reply) => {
    // Extract country from request headers (in production, use IP geolocation)
    const country = request.headers['cf-ipcountry'] ||
        request.headers['x-country-code'] ||
        'unknown';
    // Block payments from Russia
    if (country === 'RU' && request.url?.includes('/api/payments/v1')) {
        return reply.status(403).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.GEO_BLOCKED, 'Payments from this region are not allowed'));
    }
};
// Auth routes - proxy to auth-service (public)
app.register(http_proxy_1.default, {
    upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    prefix: '/api/auth/v1',
    rewritePrefix: '/api/auth/v1',
});
// User routes - proxy to user-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    prefix: '/api/user/v1',
    rewritePrefix: '/api/user/v1',
    preHandler: [jwtValidationMiddleware],
});
// Game routes - proxy to game-service (public)
app.register(http_proxy_1.default, {
    upstream: process.env.GAME_SERVICE_URL || 'http://localhost:3003',
    prefix: '/api/game/v1',
    rewritePrefix: '/api/game/v1',
});
// Session routes - proxy to session-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.SESSION_SERVICE_URL || 'http://localhost:3004',
    prefix: '/api/session/v1',
    rewritePrefix: '/api/session/v1',
    preHandler: [jwtValidationMiddleware],
});
// Replay routes - proxy to replay-engine-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.REPLAY_SERVICE_URL || 'http://localhost:3005',
    prefix: '/api/replay/v1',
    rewritePrefix: '/api/replay/v1',
    preHandler: [jwtValidationMiddleware],
});
// Video editing routes - proxy to video-editing-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.EDITING_SERVICE_URL || 'http://localhost:3006',
    prefix: '/api/editing/v1',
    rewritePrefix: '/api/editing/v1',
    preHandler: [jwtValidationMiddleware],
});
// Clip routes - proxy to clip-service (public with optional auth)
app.register(http_proxy_1.default, {
    upstream: process.env.CLIP_SERVICE_URL || 'http://localhost:3007',
    prefix: '/api/clips/v1',
    rewritePrefix: '/api/clips/v1',
    preHandler: [shared_utils_1.optionalAuthMiddleware],
});
// Feed routes - proxy to feed-service (public with optional auth)
app.register(http_proxy_1.default, {
    upstream: process.env.FEED_SERVICE_URL || 'http://localhost:3008',
    prefix: '/api/feed/v1',
    rewritePrefix: '/api/feed/v1',
    preHandler: [shared_utils_1.optionalAuthMiddleware],
});
// Payment routes - proxy to payments-service (protected + geo rules)
app.register(http_proxy_1.default, {
    upstream: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3009',
    prefix: '/api/payments/v1',
    rewritePrefix: '/api/payments/v1',
    preHandler: [jwtValidationMiddleware, geoRulesMiddleware],
});
// Wallet routes - proxy to wallet-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.WALLET_SERVICE_URL || 'http://localhost:3010',
    prefix: '/api/wallet/v1',
    rewritePrefix: '/api/wallet/v1',
    preHandler: [jwtValidationMiddleware],
});
// Analytics routes - proxy to analytics-service (public)
app.register(http_proxy_1.default, {
    upstream: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011',
    prefix: '/api/analytics/v1',
    rewritePrefix: '/api/analytics/v1',
});
// Orchestrator routes - proxy to orchestrator-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012',
    prefix: '/api/orchestrator/v1',
    rewritePrefix: '/api/orchestrator/v1',
    preHandler: [jwtValidationMiddleware],
});
// Moderation routes - proxy to moderation-service (public)
app.register(http_proxy_1.default, {
    upstream: process.env.MODERATION_SERVICE_URL || 'http://localhost:3013',
    prefix: '/api/moderation/v1',
    rewritePrefix: '/api/moderation/v1',
});
// Streaming routes - proxy to streaming-ingest-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.STREAMING_SERVICE_URL || 'http://localhost:3014',
    prefix: '/api/streaming/v1',
    rewritePrefix: '/api/streaming/v1',
    preHandler: [jwtValidationMiddleware],
});
// Creator routes - proxy to creator-service (public with optional auth)
app.register(http_proxy_1.default, {
    upstream: process.env.CREATOR_SERVICE_URL || 'http://localhost:3015',
    prefix: '/api/creator/v1',
    rewritePrefix: '/api/creator/v1',
    preHandler: [shared_utils_1.optionalAuthMiddleware],
});
// Community routes - proxy to community-service (public with optional auth)
app.register(http_proxy_1.default, {
    upstream: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3016',
    prefix: '/api/community/v1',
    rewritePrefix: '/api/community/v1',
    preHandler: [shared_utils_1.optionalAuthMiddleware],
});
// Chat routes - proxy to chat-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.CHAT_SERVICE_URL || 'http://localhost:3017',
    prefix: '/api/chat/v1',
    rewritePrefix: '/api/chat/v1',
    preHandler: [jwtValidationMiddleware],
});
// Notification routes - proxy to notification-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3018',
    prefix: '/api/notification/v1',
    rewritePrefix: '/api/notification/v1',
    preHandler: [jwtValidationMiddleware],
});
// SEO routes - proxy to seo-indexer-service (public)
app.register(http_proxy_1.default, {
    upstream: process.env.SEO_SERVICE_URL || 'http://localhost:3019',
    prefix: '/api/seo/v1',
    rewritePrefix: '/api/seo/v1',
});
// Steam Callback - proxy to steam-library-service (public, no auth)
app.register(http_proxy_1.default, {
    upstream: process.env.STEAM_LIBRARY_SERVICE_URL || 'http://localhost:3022',
    prefix: '/api/steam/v1/callback',
    rewritePrefix: '/callback',
});
// Steam Library (Public/Pass-through) - proxy to steam-library-service
// We allow the service to handle auth validation so the frontend can query it directly
app.register(http_proxy_1.default, {
    upstream: process.env.STEAM_LIBRARY_SERVICE_URL || 'http://localhost:3022',
    prefix: '/api/steam/v1/library',
    rewritePrefix: '/api/user/library',
});
// Steam Library routes - proxy to steam-library-service (protected)
app.register(http_proxy_1.default, {
    upstream: process.env.STEAM_LIBRARY_SERVICE_URL || 'http://localhost:3022',
    prefix: '/api/steam/v1',
    rewritePrefix: '/api', // Steam service has /api/games/... so we map /api/steam/v1/games -> /api/games
    preHandler: [jwtValidationMiddleware],
});
// Error handler
app.setErrorHandler((error, request, reply) => {
    const correlationId = request.correlationId || request.id || 'unknown';
    app.log.error({
        correlationId,
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
    }, 'Request error');
    reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Internal server error'));
});
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
app.listen({ port: PORT, host: HOST }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Gateway service listening on ${HOST}:${PORT}`);
});

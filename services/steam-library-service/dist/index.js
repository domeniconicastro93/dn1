"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const shared_utils_1 = require("@strike/shared-utils");
const library_cache_1 = require("./library-cache");
const env_1 = require("./env");
const shared_db_1 = require("@strike/shared-db");
const openid_1 = require("./openid");
const crypto_1 = require("crypto");
const shared_utils_2 = require("@strike/shared-utils");
const steam_web_api_1 = require("./steam-web-api");
const app = (0, fastify_1.default)({
    logger: true,
});
app.register(cors_1.default, {
    origin: true,
    credentials: true,
});
app.register(cookie_1.default, {
    secret: process.env.COOKIE_SECRET || 'dev-secret',
    hook: 'onRequest',
});
const cache = new library_cache_1.SteamLibraryCache();
const rateLimitMiddleware = async (request, reply) => {
    const clientId = request.ip || 'steam-service';
    const result = shared_utils_1.rateLimiter.check(`steam-library:${clientId}`, shared_utils_1.RateLimitConfigs.PUBLIC_GET);
    if (!result.allowed) {
        reply.status(429).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Too many requests. Please try again later.'));
        return;
    }
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
};
app.get('/health', async () => {
    return (0, shared_utils_1.successResponse)({ status: 'ok', service: 'steam-library-service' });
});
app.get('/api/games/installed', { preHandler: [rateLimitMiddleware] }, async () => {
    const library = await cache.getInstalledGames();
    return (0, shared_utils_1.successResponse)(library);
});
app.get('/api/games/steam/library', { preHandler: [rateLimitMiddleware] }, async () => {
    const raw = cache.getRawEntries();
    return (0, shared_utils_1.successResponse)({
        count: raw.length,
        apps: raw,
    });
});
app.post('/api/games/steam/sync', async () => {
    const results = await cache.sync();
    return (0, shared_utils_1.successResponse)(results);
});
app.get('/api/user/library', {
    preHandler: [rateLimitMiddleware, shared_utils_2.authMiddleware]
}, async (request, reply) => {
    const tokenUser = request.user;
    if (!tokenUser || !tokenUser.userId) {
        return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'User not authenticated'));
    }
    // Fetch fresh user data from DB to get steamId64
    const user = await shared_db_1.prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: { steamId64: true }
    });
    if (!user || !user.steamId64) {
        return (0, shared_utils_1.successResponse)({ ownedGames: [], privacyState: 'unknown' });
    }
    const { games, privacyState } = await (0, steam_web_api_1.getOwnedGames)(user.steamId64);
    return (0, shared_utils_1.successResponse)({
        ownedGames: games,
        totalCount: games.length,
        privacyState
    });
});
// Steam Auth Initiation
app.get('/api/auth', {
    preHandler: [shared_utils_2.authMiddleware]
}, async (request, reply) => {
    const user = request.user;
    if (!user) {
        return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'Authentication required'));
    }
    const nonce = (0, crypto_1.randomUUID)();
    const state = JSON.stringify({ userId: user.userId, nonce });
    const stateBase64 = Buffer.from(state).toString('base64url');
    // Set cookie
    reply.setCookie('steam_link_state', stateBase64, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 300,
    });
    const steamUrl = (0, openid_1.buildSteamLoginUrl)(stateBase64);
    return reply.redirect(steamUrl);
});
// Steam Callback
app.get('/callback', async (request, reply) => {
    const query = request.query;
    const searchParams = new URLSearchParams(query);
    console.log('[STEAM CALLBACK] query:', query);
    console.log('[STEAM CALLBACK] cookies:', request.cookies);
    // 1. Validate OpenID
    let validation;
    try {
        validation = await (0, openid_1.validateSteamCallback)(searchParams);
    }
    catch (e) {
        console.error('[STEAM CALLBACK] OpenID validation exception:', e);
        return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'OpenID validation exception'));
    }
    if (!validation.valid || !validation.steamId64) {
        console.error('[STEAM CALLBACK] OpenID validation failed');
        return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid OpenID response'));
    }
    // 2. Validate State & CSRF
    const stateParam = query.state;
    console.log('[STEAM CALLBACK] state raw:', stateParam);
    if (!stateParam) {
        console.error('[STEAM CALLBACK] Missing state parameter');
        return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'Missing state parameter'));
    }
    const cookieState = request.cookies['steam_link_state'];
    console.log('[STEAM CALLBACK] cookie steam_link_state:', cookieState);
    if (!cookieState || cookieState !== stateParam) {
        console.error('[STEAM CALLBACK] CSRF mismatch: cookie state does not match query state');
        return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.UNAUTHORIZED, 'Invalid state (CSRF check failed)'));
    }
    let state;
    try {
        const stateJson = Buffer.from(stateParam, 'base64url').toString('utf-8');
        state = JSON.parse(stateJson);
        console.log('[STEAM CALLBACK] Parsed state:', state);
    }
    catch (e) {
        console.error('[STEAM CALLBACK] Failed to parse state JSON:', e);
        return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid state format'));
    }
    const userId = state.userId;
    console.log('[STEAM CALLBACK] userId:', userId);
    console.log('[STEAM CALLBACK] steamId64:', validation.steamId64);
    if (!userId) {
        console.error('[STEAM CALLBACK] State missing userId');
        return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid state: missing userId'));
    }
    // 3. Update User in DB
    try {
        console.log(`[STEAM CALLBACK] Updating user ${userId} with SteamID ${validation.steamId64}`);
        await shared_db_1.prisma.user.update({
            where: { id: userId },
            data: { steamId64: validation.steamId64 },
        });
    }
    catch (error) {
        console.error('[STEAM CALLBACK] Database update failed:', error);
        // Handle Unique Constraint Violation (Steam ID already linked to another user)
        if (error.code === 'P2002') {
            console.log('[STEAM CALLBACK] Steam ID already linked. Stealing link...');
            try {
                // 1. Find and unlink the other user
                const conflict = await shared_db_1.prisma.user.findFirst({
                    where: { steamId64: validation.steamId64 }
                });
                if (conflict) {
                    await shared_db_1.prisma.user.update({
                        where: { id: conflict.id },
                        data: { steamId64: null }
                    });
                }
                // 2. Retry update for current user
                await shared_db_1.prisma.user.update({
                    where: { id: userId },
                    data: { steamId64: validation.steamId64 },
                });
                console.log('[STEAM CALLBACK] Link stolen successfully.');
            }
            catch (retryError) {
                console.error('[STEAM CALLBACK] Failed to steal link:', retryError);
                return reply.status(409).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.CONFLICT, 'Steam account already linked to another user'));
            }
        }
        else if (error.code === 'P2025') { // Record to update not found
            return reply.status(404).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.NOT_FOUND, 'User not found'));
        }
        else {
            return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to update user record'));
        }
    }
    // 4. Clear Cookie
    reply.clearCookie('steam_link_state', { path: '/' });
    // 5. Determine Redirect
    // state.redirect comes from the frontend (e.g. "/games" or "/games/123")
    const redirectPath = state.redirect || '/games';
    const baseUrl = 'http://localhost:3005'; // Frontend URL
    // Construct final URL
    // If redirectPath contains '?', append &steam=linked, else ?steam=linked
    const separator = redirectPath.includes('?') ? '&' : '?';
    const finalUrl = `${baseUrl}${redirectPath}${separator}steam=linked`;
    console.log('[STEAM CALLBACK] SUCCESS → redirect to:', finalUrl);
    return reply.redirect(finalUrl);
});
app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Steam library service internal error'));
});
app.listen({ host: env_1.SERVICE_HOST, port: env_1.SERVICE_PORT }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Steam Library Service listening on ${env_1.SERVICE_HOST}:${env_1.SERVICE_PORT}`);
});

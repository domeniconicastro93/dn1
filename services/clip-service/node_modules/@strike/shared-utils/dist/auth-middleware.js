"use strict";
/**
 * Authentication Middleware for Fastify
 *
 * Validates JWT tokens and extracts user context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jwt_1 = require("./jwt");
const response_1 = require("./response");
/**
 * JWT Authentication Middleware
 *
 * Validates JWT token from Authorization header OR cookie and attaches user context to request
 */
async function authMiddleware(request, reply) {
    // Use the unified token extraction utility (tries header first, then cookie)
    const token = (0, jwt_1.extractTokenFromHeaderOrCookie)(request.headers.authorization, request.headers.cookie, 'strike_access_token');
    if (!token) {
        reply.status(401).send((0, response_1.errorResponse)(response_1.ErrorCodes.UNAUTHORIZED, 'Authentication required'));
        return;
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        request.user = {
            userId: payload.userId,
            email: payload.email,
            steamId64: payload.steamId64,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid token';
        if (errorMessage === 'TOKEN_EXPIRED') {
            reply.status(401).send((0, response_1.errorResponse)(response_1.ErrorCodes.TOKEN_EXPIRED, 'Token has expired'));
            return;
        }
        reply.status(401).send((0, response_1.errorResponse)(response_1.ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'));
        return;
    }
}
/**
 * Optional Authentication Middleware
 *
 * Attaches user context if token is present, but doesn't fail if missing
 */
async function optionalAuthMiddleware(request, reply) {
    const token = (0, jwt_1.extractTokenFromHeaderOrCookie)(request.headers.authorization, request.headers.cookie, 'strike_access_token');
    if (token) {
        try {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            request.user = {
                userId: payload.userId,
                email: payload.email,
                steamId64: payload.steamId64,
            };
        }
        catch {
            // Ignore errors for optional auth
        }
    }
}

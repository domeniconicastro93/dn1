"use strict";
/**
 * JWT Authentication Utilities
 *
 * Provides JWT token generation, validation, and refresh token management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateTokenPair = generateTokenPair;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.extractTokenFromCookie = extractTokenFromCookie;
exports.extractTokenFromHeaderOrCookie = extractTokenFromHeaderOrCookie;
exports.getUserIdFromToken = getUserIdFromToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-key-123';
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'change-me-in-production-refresh';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '15m';
const getJwtRefreshExpiresIn = () => process.env.JWT_REFRESH_EXPIRES_IN || '7d';
/**
 * Generate access token
 */
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email, steamId64: payload.steamId64 }, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
}
/**
 * Generate refresh token
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email, steamId64: payload.steamId64 }, getJwtRefreshSecret(), { expiresIn: getJwtRefreshExpiresIn() });
}
/**
 * Generate token pair (access + refresh)
 */
function generateTokenPair(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}
/**
 * Verify access token
 */
function verifyAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('TOKEN_EXPIRED');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('INVALID_TOKEN');
        }
        throw error;
    }
}
/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, getJwtRefreshSecret());
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
        throw error;
    }
}
/**
 * Extract token from Authorization header
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader)
        return null;
    if (!authHeader.startsWith('Bearer '))
        return null;
    return authHeader.substring(7);
}
/**
 * Extract token from cookie string
 */
function extractTokenFromCookie(cookieHeader, cookieName = 'strike_access_token') {
    if (!cookieHeader)
        return null;
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        const key = parts[0];
        const value = parts.slice(1).join('=');
        acc[key] = value;
        return acc;
    }, {});
    return cookies[cookieName] || null;
}
/**
 * Extract token from header OR cookie (unified)
 * This is the recommended way to extract tokens in all services
 */
function extractTokenFromHeaderOrCookie(authHeader, cookieHeader, cookieName = 'strike_access_token') {
    // Try Authorization header first (preferred)
    let token = extractTokenFromHeader(authHeader);
    // Fallback to cookie
    if (!token && cookieHeader) {
        token = extractTokenFromCookie(cookieHeader, cookieName);
    }
    return token;
}
/**
 * Get user ID from token (without verification, for logging purposes)
 */
function getUserIdFromToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded?.userId || null;
    }
    catch {
        return null;
    }
}

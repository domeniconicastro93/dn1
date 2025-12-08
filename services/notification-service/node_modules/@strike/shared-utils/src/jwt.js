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
exports.getUserIdFromToken = getUserIdFromToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-in-production-refresh';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
/**
 * Generate access token
 */
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
/**
 * Generate refresh token
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
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

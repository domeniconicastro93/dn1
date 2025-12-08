/**
 * JWT Authentication Utilities
 *
 * Provides JWT token generation, validation, and refresh token management
 */
export interface JWTPayload {
    userId: string;
    email: string;
    steamId64?: string;
    iat?: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
/**
 * Generate access token
 */
export declare function generateAccessToken(payload: {
    userId: string;
    email: string;
    steamId64?: string;
}): string;
/**
 * Generate refresh token
 */
export declare function generateRefreshToken(payload: {
    userId: string;
    email: string;
    steamId64?: string;
}): string;
/**
 * Generate token pair (access + refresh)
 */
export declare function generateTokenPair(payload: {
    userId: string;
    email: string;
    steamId64?: string;
}): TokenPair;
/**
 * Verify access token
 */
export declare function verifyAccessToken(token: string): JWTPayload;
/**
 * Verify refresh token
 */
export declare function verifyRefreshToken(token: string): JWTPayload;
/**
 * Extract token from Authorization header
 */
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
/**
 * Extract token from cookie string
 */
export declare function extractTokenFromCookie(cookieHeader: string | undefined, cookieName?: string): string | null;
/**
 * Extract token from header OR cookie (unified)
 * This is the recommended way to extract tokens in all services
 */
export declare function extractTokenFromHeaderOrCookie(authHeader: string | undefined, cookieHeader: string | undefined, cookieName?: string): string | null;
/**
 * Get user ID from token (without verification, for logging purposes)
 */
export declare function getUserIdFromToken(token: string): string | null;

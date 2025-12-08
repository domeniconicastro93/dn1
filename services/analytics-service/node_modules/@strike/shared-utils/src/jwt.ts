/**
 * JWT Authentication Utilities
 * 
 * Provides JWT token generation, validation, and refresh token management
 */

import jwt, { SignOptions } from 'jsonwebtoken';

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

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-key-123';
const getJwtRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'change-me-in-production-refresh';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '15m';
const getJwtRefreshExpiresIn = () => process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token
 */
export function generateAccessToken(payload: { userId: string; email: string; steamId64?: string }): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, steamId64: payload.steamId64 },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() } as SignOptions
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: { userId: string; email: string; steamId64?: string }): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, steamId64: payload.steamId64 },
    getJwtRefreshSecret(),
    { expiresIn: getJwtRefreshExpiresIn() } as SignOptions
  );
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload: { userId: string; email: string; steamId64?: string }): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, getJwtRefreshSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Extract token from cookie string
 */
export function extractTokenFromCookie(cookieHeader: string | undefined, cookieName: string = 'strike_access_token'): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie: string) => {
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
export function extractTokenFromHeaderOrCookie(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  cookieName: string = 'strike_access_token'
): string | null {
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
export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

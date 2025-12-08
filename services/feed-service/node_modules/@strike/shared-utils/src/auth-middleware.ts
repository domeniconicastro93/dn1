/**
 * Authentication Middleware for Fastify
 * 
 * Validates JWT tokens and extracts user context
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, extractTokenFromHeaderOrCookie } from './jwt';
import { errorResponse, ErrorCodes } from './response';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
    steamId64?: string;
  };
}

/**
 * JWT Authentication Middleware
 * 
 * Validates JWT token from Authorization header OR cookie and attaches user context to request
 */
export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // Use the unified token extraction utility (tries header first, then cookie)
  const token = extractTokenFromHeaderOrCookie(
    request.headers.authorization,
    request.headers.cookie,
    'strike_access_token'
  );

  if (!token) {
    reply.status(401).send(
      errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    );
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.user = {
      userId: payload.userId,
      email: payload.email,
      steamId64: payload.steamId64,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid token';

    if (errorMessage === 'TOKEN_EXPIRED') {
      reply.status(401).send(
        errorResponse(ErrorCodes.TOKEN_EXPIRED, 'Token has expired')
      );
      return;
    }

    reply.status(401).send(
      errorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token')
    );
    return;
  }
}

/**
 * Optional Authentication Middleware
 * 
 * Attaches user context if token is present, but doesn't fail if missing
 */
export async function optionalAuthMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractTokenFromHeaderOrCookie(
    request.headers.authorization,
    request.headers.cookie,
    'strike_access_token'
  );

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      request.user = {
        userId: payload.userId,
        email: payload.email,
        steamId64: payload.steamId64,
      };
    } catch {
      // Ignore errors for optional auth
    }
  }
}

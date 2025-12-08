/**
 * Session Middleware - Alias for backward compatibility
 * 
 * This file provides the path structure requested in requirements.
 * It re-exports from the actual implementation in lib/server/strike-auth.ts
 */

export {
  getStrikeSession,
  requireStrikeSession,
  getStrikeSessionWithProfile,
  requireStrikeSessionWithProfile,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAuthCookies,
  type StrikeSession,
  type StrikeSessionWithProfile,
} from '@/lib/server/strike-auth';


/**
 * Rate Limiting Utilities
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// In-memory rate limiter (for Phase 4)
// TODO: Replace with Redis-based rate limiter in production
class MemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  check(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      // Create new window
      const resetTime = now + config.windowMs;
      this.store.set(key, {
        count: 1,
        resetTime,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
      };
    }

    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }
}

export const rateLimiter = new MemoryRateLimiter();

// Default rate limit configs
export const RateLimitConfigs = {
  PUBLIC_GET: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  AUTHENTICATED: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
  },
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const;


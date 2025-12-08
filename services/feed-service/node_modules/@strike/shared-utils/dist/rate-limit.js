"use strict";
/**
 * Rate Limiting Utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitConfigs = exports.rateLimiter = void 0;
// In-memory rate limiter (for Phase 4)
// TODO: Replace with Redis-based rate limiter in production
class MemoryRateLimiter {
    store = new Map();
    check(key, config) {
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
exports.rateLimiter = new MemoryRateLimiter();
// Default rate limit configs
exports.RateLimitConfigs = {
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
};

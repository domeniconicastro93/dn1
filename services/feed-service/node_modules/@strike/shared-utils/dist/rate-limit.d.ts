/**
 * Rate Limiting Utilities
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}
declare class MemoryRateLimiter {
    private store;
    check(key: string, config: RateLimitConfig): RateLimitResult;
}
export declare const rateLimiter: MemoryRateLimiter;
export declare const RateLimitConfigs: {
    readonly PUBLIC_GET: {
        readonly windowMs: number;
        readonly maxRequests: 60;
    };
    readonly AUTHENTICATED: {
        readonly windowMs: number;
        readonly maxRequests: 120;
    };
    readonly PAYMENT: {
        readonly windowMs: number;
        readonly maxRequests: 10;
    };
};
export {};

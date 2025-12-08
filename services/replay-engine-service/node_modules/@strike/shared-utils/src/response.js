"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = void 0;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
/**
 * Standard API Response Envelope
 */
function successResponse(data, meta) {
    return {
        data,
        ...(meta && { meta }),
    };
}
function errorResponse(code, message, details) {
    const error = {
        code,
        message,
    };
    if (details) {
        error.details = details;
    }
    return { error };
}
// Common error codes
exports.ErrorCodes = {
    // 400 - Bad Request
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    // 401 - Unauthorized
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    // 403 - Forbidden
    FORBIDDEN: 'FORBIDDEN',
    GEO_BLOCKED: 'GEO_BLOCKED',
    PAYMENT_BLOCKED: 'PAYMENT_BLOCKED',
    // 404 - Not Found
    NOT_FOUND: 'NOT_FOUND',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    // 409 - Conflict
    CONFLICT: 'CONFLICT',
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    HANDLE_TAKEN: 'HANDLE_TAKEN',
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    // 429 - Too Many Requests
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    // 500 - Internal Server Error
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

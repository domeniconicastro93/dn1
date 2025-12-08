import type { ApiResponse, ApiError } from '@strike/shared-types';
/**
 * Standard API Response Envelope
 */
export declare function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T>;
export declare function errorResponse(code: string, message: string, details?: unknown): ApiError;
export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly GEO_BLOCKED: "GEO_BLOCKED";
    readonly PAYMENT_BLOCKED: "PAYMENT_BLOCKED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly EMAIL_TAKEN: "EMAIL_TAKEN";
    readonly EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS";
    readonly HANDLE_TAKEN: "HANDLE_TAKEN";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
};

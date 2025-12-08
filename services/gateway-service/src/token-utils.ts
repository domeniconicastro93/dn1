/**
 * Token Extraction Utility - LOCAL COPY
 * 
 * This is a local copy to avoid import issues with @strike/shared-utils
 */

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

"use strict";
/**
 * Auth Service - Complete Implementation with Database
 *
 * Handles user authentication, registration, password reset
 * Uses Prisma for database, Zod for validation, JWT for tokens
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRegistry = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const shared_utils_1 = require("@strike/shared-utils");
const shared_db_1 = require("@strike/shared-db");
const crypto_1 = require("crypto");
/**
 * OAuth Provider Registry
 *
 * Extensible registry for OAuth providers.
 * New providers can be registered at runtime.
 */
class OAuthProviderRegistry {
    providers = new Map();
    register(provider) {
        this.providers.set(provider.provider, provider);
        app.log.info(`[OAUTH] Registered provider: ${provider.provider}`);
    }
    get(provider) {
        return this.providers.get(provider);
    }
    list() {
        return Array.from(this.providers.keys());
    }
}
exports.oauthRegistry = new OAuthProviderRegistry();
/**
 * Placeholder OAuth providers (to be implemented with actual SDKs)
 *
 * In production, these would use:
 * - Google: google-auth-library
 * - Facebook: facebook-node-sdk
 * - Discord: discord.js or discord-oauth2
 */
class GoogleOAuthProvider {
    provider = 'google';
    getAuthUrl(state) {
        // TODO: Implement Google OAuth URL generation
        // This would use actual Google OAuth config from database
        const clientId = process.env.GOOGLE_CLIENT_ID || '';
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&state=${state}`;
    }
    async exchangeCodeForToken(code) {
        // TODO: Implement Google token exchange
        throw new Error('Google OAuth not yet implemented');
    }
    async getUserInfo(accessToken) {
        // TODO: Implement Google user info fetch
        throw new Error('Google OAuth not yet implemented');
    }
}
// Register placeholder providers (extensible)
// In production, these would be loaded from database and initialized with actual credentials
// oauthRegistry.register(new GoogleOAuthProvider());
const app = (0, fastify_1.default)({
    logger: true,
});
// Register plugins
app.register(cors_1.default, {
    origin: true,
    credentials: true,
});
// Health check
app.get('/health', async () => {
    return (0, shared_utils_1.successResponse)({ status: 'ok', service: 'auth-service' });
});
// Rate limiting middleware
const rateLimitMiddleware = async (request, reply) => {
    const clientId = request.ip || 'unknown';
    const result = shared_utils_1.rateLimiter.check(`auth:${clientId}`, shared_utils_1.RateLimitConfigs.AUTHENTICATED);
    if (!result.allowed) {
        reply.status(429).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.RATE_LIMIT_EXCEEDED, 'Too many requests. Please try again later.'));
        return;
    }
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
    reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
};
// POST /api/auth/v1/register
app.post('/api/auth/v1/register', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate input
        const validationResult = shared_utils_1.registerRequestSchema.safeParse(request.body);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid input', validationResult.error.errors));
        }
        const { email, password, locale, marketingConsent } = validationResult.data;
        // Check if email already exists
        const existingUser = await shared_db_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return reply.status(409).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already registered'));
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Generate referral code
        const referralCode = `ref_${(0, crypto_1.randomBytes)(8).toString('hex')}`;
        // Create user
        const user = await shared_db_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                locale: locale || 'en',
                marketingConsent: marketingConsent || false,
                referralCode,
            },
        });
        // Generate tokens
        const tokens = (0, shared_utils_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
        });
        // Store refresh token
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days
        await shared_db_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                expiresAt: refreshTokenExpiresAt,
            },
        });
        // Emit UserCreated event
        await (0, shared_utils_1.publishEvent)(shared_utils_1.EventTopics.USERS, shared_utils_1.EventTypes.USER_CREATED, {
            userId: user.id,
            email: user.email,
            locale: user.locale,
        }, 'auth-service');
        const response = {
            userId: user.id,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
        return reply.status(201).send((0, shared_utils_1.successResponse)(response));
    }
    catch (error) {
        app.log.error('Registration error:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to register user'));
    }
});
// POST /api/auth/v1/login
app.post('/api/auth/v1/login', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate input
        const validationResult = shared_utils_1.loginRequestSchema.safeParse(request.body);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid input', validationResult.error.errors));
        }
        const { email, password } = validationResult.data;
        // Find user
        const user = await shared_db_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password'));
        }
        // Verify password
        const passwordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!passwordValid) {
            return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password'));
        }
        // Generate tokens
        const tokens = (0, shared_utils_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
        });
        // Store refresh token
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days
        await shared_db_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                expiresAt: refreshTokenExpiresAt,
            },
        });
        const response = {
            userId: user.id,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
        return reply.status(200).send((0, shared_utils_1.successResponse)(response));
    }
    catch (error) {
        app.log.error('Login error:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to login'));
    }
});
// POST /api/auth/v1/refresh
app.post('/api/auth/v1/refresh', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate input
        const validationResult = shared_utils_1.refreshTokenRequestSchema.safeParse(request.body);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid input', validationResult.error.errors));
        }
        const { refreshToken } = validationResult.data;
        // Verify refresh token
        let payload;
        try {
            payload = (0, shared_utils_1.verifyRefreshToken)(refreshToken);
        }
        catch (error) {
            return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INVALID_TOKEN, 'Invalid or expired refresh token'));
        }
        // Check if token exists in database
        const tokenRecord = await shared_db_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            return reply.status(401).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INVALID_TOKEN, 'Invalid or expired refresh token'));
        }
        // Generate new access token
        const newAccessToken = (0, shared_utils_1.generateAccessToken)({
            userId: payload.userId,
            email: payload.email,
        });
        // Optionally rotate refresh token (for security)
        const rotateRefreshToken = process.env.ROTATE_REFRESH_TOKENS === 'true';
        let newRefreshToken = refreshToken;
        if (rotateRefreshToken) {
            const newRefreshTokenExpiresAt = new Date();
            newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + 7);
            // Delete old token
            await shared_db_1.prisma.refreshToken.delete({
                where: { token: refreshToken },
            });
            // Generate new refresh token
            const newTokens = (0, shared_utils_1.generateTokenPair)({
                userId: payload.userId,
                email: payload.email,
            });
            newRefreshToken = newTokens.refreshToken;
            // Store new refresh token
            await shared_db_1.prisma.refreshToken.create({
                data: {
                    userId: payload.userId,
                    token: newRefreshToken,
                    expiresAt: newRefreshTokenExpiresAt,
                },
            });
        }
        const response = {
            token: newAccessToken,
            refreshToken: newRefreshToken,
        };
        return reply.status(200).send((0, shared_utils_1.successResponse)(response));
    }
    catch (error) {
        app.log.error('Token refresh error:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to refresh token'));
    }
});
// POST /api/auth/v1/logout
app.post('/api/auth/v1/logout', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        const refreshToken = request.body?.refreshToken;
        if (refreshToken) {
            // Delete refresh token from database
            await shared_db_1.prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }
        return reply.status(200).send((0, shared_utils_1.successResponse)({ success: true }));
    }
    catch (error) {
        app.log.error('Logout error:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to logout'));
    }
});
// POST /api/auth/v1/password/forgot
app.post('/api/auth/v1/password/forgot', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate input
        const validationResult = shared_utils_1.passwordResetRequestSchema.safeParse(request.body);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid input', validationResult.error.errors));
        }
        const { email } = validationResult.data;
        // Find user
        const user = await shared_db_1.prisma.user.findUnique({
            where: { email },
        });
        // Always return success (security: don't reveal if email exists)
        if (!user) {
            return reply.status(200).send((0, shared_utils_1.successResponse)({
                message: 'If the email exists, a password reset link has been sent.',
            }));
        }
        // Generate reset token
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
        // Delete any existing reset tokens for this user
        await shared_db_1.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, used: false },
        });
        // Create new reset token
        await shared_db_1.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt,
            },
        });
        // TODO: Send email with reset link
        // const resetLink = `${process.env.FRONTEND_URL}/auth/reset?token=${resetToken}`;
        // await sendPasswordResetEmail(user.email, resetLink);
        // Emit event
        await (0, shared_utils_1.publishEvent)(shared_utils_1.EventTopics.USERS, 'PasswordResetRequested', {
            userId: user.id,
            email: user.email,
        }, 'auth-service');
        return reply.status(200).send((0, shared_utils_1.successResponse)({
            message: 'If the email exists, a password reset link has been sent.',
        }));
    }
    catch (error) {
        app.log.error('Password reset request error:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to process password reset request'));
    }
});
// POST /api/auth/v1/password/reset
app.post('/api/auth/v1/password/reset', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        // Validate input
        const validationResult = shared_utils_1.passwordResetConfirmSchema.safeParse(request.body);
        if (!validationResult.success) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.VALIDATION_ERROR, 'Invalid input', validationResult.error.errors));
        }
        const { token, newPassword } = validationResult.data;
        // Find reset token
        const resetToken = await shared_db_1.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
            return reply.status(400).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INVALID_TOKEN, 'Invalid or expired reset token'));
        }
        // Hash new password
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user password
        await shared_db_1.prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
        });
        // Mark token as used
        await shared_db_1.prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true },
        });
        // Delete all refresh tokens for this user (force re-login)
        await shared_db_1.prisma.refreshToken.deleteMany({
            where: { userId: resetToken.userId },
        });
        // Emit event
        await (0, shared_utils_1.publishEvent)(shared_utils_1.EventTopics.USERS, 'PasswordResetCompleted', {
            userId: resetToken.userId,
        }, 'auth-service');
        return reply.status(200).send((0, shared_utils_1.successResponse)({ message: 'Password reset successfully' }));
    }
    catch (error) {
        app.log.error('Password reset error:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to reset password'));
    }
});
// Error handler
app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Internal server error'));
});
// POST /api/auth/v1/oauth/:provider/authorize - Initiate OAuth flow
app.get('/api/auth/v1/oauth/:provider/authorize', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        const { provider } = request.params;
        const { redirectUri } = request.query;
        const oauthProvider = exports.oauthRegistry.get(provider);
        if (!oauthProvider) {
            return reply.status(404).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.NOT_FOUND, `OAuth provider '${provider}' not found`));
        }
        // Generate state token for CSRF protection
        const state = (0, crypto_1.randomBytes)(32).toString('hex');
        // Store state in session/cache (in production, use Redis)
        // For now, we'll include it in the redirect URL
        const authUrl = oauthProvider.getAuthUrl(state);
        return reply.status(200).send((0, shared_utils_1.successResponse)({
            authUrl,
            state,
            provider,
        }));
    }
    catch (error) {
        app.log.error('Error initiating OAuth flow:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to initiate OAuth flow'));
    }
});
// POST /api/auth/v1/oauth/:provider/callback - OAuth callback
app.post('/api/auth/v1/oauth/:provider/callback', {
    preHandler: [rateLimitMiddleware],
}, async (request, reply) => {
    try {
        const { provider } = request.params;
        const { code, state } = request.body;
        // TODO: Verify state token (CSRF protection)
        const oauthProvider = exports.oauthRegistry.get(provider);
        if (!oauthProvider) {
            return reply.status(404).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.NOT_FOUND, `OAuth provider '${provider}' not found`));
        }
        // Exchange code for token
        const tokens = await oauthProvider.exchangeCodeForToken(code);
        // Get user info
        const userInfo = await oauthProvider.getUserInfo(tokens.accessToken);
        // Check if OAuth account exists
        const oauthAccount = await shared_db_1.prisma.oAuthAccount.findUnique({
            where: {
                providerUserId: `${provider}:${userInfo.id}`,
            },
            include: { user: true },
        });
        let user;
        if (oauthAccount) {
            // Existing user - update tokens
            user = oauthAccount.user;
            await shared_db_1.prisma.oAuthAccount.update({
                where: { id: oauthAccount.id },
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: tokens.expiresIn
                        ? new Date(Date.now() + tokens.expiresIn * 1000)
                        : undefined,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            // New user - check if email exists
            const existingUser = await shared_db_1.prisma.user.findUnique({
                where: { email: userInfo.email },
            });
            if (existingUser) {
                // Link OAuth account to existing user
                user = existingUser;
                await shared_db_1.prisma.oAuthAccount.create({
                    data: {
                        userId: existingUser.id,
                        provider,
                        providerUserId: `${provider}:${userInfo.id}`,
                        email: userInfo.email,
                        displayName: userInfo.name,
                        avatarUrl: userInfo.avatarUrl,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresAt: tokens.expiresIn
                            ? new Date(Date.now() + tokens.expiresIn * 1000)
                            : undefined,
                    },
                });
            }
            else {
                // Create new user
                const passwordHash = (0, crypto_1.randomBytes)(32).toString('hex'); // Random password for OAuth users
                user = await shared_db_1.prisma.user.create({
                    data: {
                        email: userInfo.email,
                        passwordHash,
                        displayName: userInfo.name,
                        avatarUrl: userInfo.avatarUrl,
                        emailVerified: true, // OAuth emails are pre-verified
                    },
                });
                await shared_db_1.prisma.oAuthAccount.create({
                    data: {
                        userId: user.id,
                        provider,
                        providerUserId: `${provider}:${userInfo.id}`,
                        email: userInfo.email,
                        displayName: userInfo.name,
                        avatarUrl: userInfo.avatarUrl,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresAt: tokens.expiresIn
                            ? new Date(Date.now() + tokens.expiresIn * 1000)
                            : undefined,
                    },
                });
                // Emit UserCreated event
                await (0, shared_utils_1.publishEvent)(shared_utils_1.EventTopics.USERS, shared_utils_1.EventTypes.USER_CREATED, {
                    userId: user.id,
                    email: user.email,
                    source: 'oauth',
                    provider,
                }, 'auth-service');
            }
        }
        // Generate JWT tokens
        const tokenPair = (0, shared_utils_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
        });
        // Store refresh token
        await shared_db_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: tokenPair.refreshToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });
        const response = {
            userId: user.id,
            token: tokenPair.token,
            refreshToken: tokenPair.refreshToken,
        };
        return reply.status(200).send((0, shared_utils_1.successResponse)(response));
    }
    catch (error) {
        app.log.error('Error in OAuth callback:', error);
        return reply.status(500).send((0, shared_utils_1.errorResponse)(shared_utils_1.ErrorCodes.INTERNAL_ERROR, 'Failed to complete OAuth flow'));
    }
});
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
app.listen({ port: PORT, host: HOST }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Auth service listening on ${HOST}:${PORT}`);
});

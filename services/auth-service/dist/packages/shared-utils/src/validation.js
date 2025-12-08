"use strict";
/**
 * Zod Validation Schemas
 *
 * Runtime validation for all DTOs using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexContentRequestSchema = exports.sitemapQuerySchema = exports.vmIdParamSchema = exports.findVMRequestSchema = exports.renderRequestSchema = exports.editInstructionsSchema = exports.notificationIdParamSchema = exports.notificationListQuerySchema = exports.chatMessageListQuerySchema = exports.sendMessageRequestSchema = exports.chatChannelIdParamSchema = exports.chatChannelListQuerySchema = exports.joinHubRequestSchema = exports.communityHubIdParamSchema = exports.communityHubListQuerySchema = exports.contentFlagRequestSchema = exports.moderationRequestSchema = exports.analyticsMetricsQuerySchema = exports.analyticsEventSchema = exports.walletTransactionQuerySchema = exports.createCheckoutSessionRequestSchema = exports.creatorHandleParamSchema = exports.creatorListQuerySchema = exports.liveStreamIdParamSchema = exports.liveStreamListQuerySchema = exports.getFeedRequestSchema = exports.createClipFromReplayRequestSchema = exports.clipIdParamSchema = exports.clipListQuerySchema = exports.replayIdParamSchema = exports.saveReplayRequestSchema = exports.sessionIdParamSchemaAlt = exports.sessionIdParamSchema = exports.createSessionRequestSchema = exports.gameSlugParamSchema = exports.gameListQuerySchema = exports.updateUserRequestSchema = exports.passwordResetConfirmSchema = exports.passwordResetRequestSchema = exports.refreshTokenRequestSchema = exports.loginRequestSchema = exports.registerRequestSchema = exports.isoDateSchema = exports.urlSchema = exports.emailSchema = exports.uuidSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// COMMON VALIDATORS
// ============================================================================
exports.uuidSchema = zod_1.z.string().uuid();
exports.emailSchema = zod_1.z.string().email();
exports.urlSchema = zod_1.z.string().url();
exports.isoDateSchema = zod_1.z.string().datetime();
// ============================================================================
// AUTH VALIDATORS
// ============================================================================
exports.registerRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(8).max(128),
    locale: zod_1.z.string().length(2).default('en'),
    marketingConsent: zod_1.z.boolean().optional(),
});
exports.loginRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1),
});
exports.refreshTokenRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.passwordResetRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
});
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8).max(128),
});
// ============================================================================
// USER VALIDATORS
// ============================================================================
exports.updateUserRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    handle: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    avatarUrl: exports.urlSchema.optional(),
    locale: zod_1.z.string().length(2).optional(),
    steamId64: zod_1.z
        .string()
        .regex(/^\d+$/)
        .min(5)
        .max(32)
        .optional(),
});
// ============================================================================
// GAME VALIDATORS
// ============================================================================
exports.gameListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    genre: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
exports.gameSlugParamSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1),
});
// ============================================================================
// SESSION VALIDATORS
// ============================================================================
exports.createSessionRequestSchema = zod_1.z.object({
    gameId: exports.uuidSchema,
    region: zod_1.z.string().min(1).optional(),
    deviceInfo: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.sessionIdParamSchema = zod_1.z.object({
    sessionId: exports.uuidSchema,
});
exports.sessionIdParamSchemaAlt = zod_1.z.object({
    id: exports.uuidSchema,
});
// ============================================================================
// REPLAY VALIDATORS
// ============================================================================
exports.saveReplayRequestSchema = zod_1.z.object({
    sessionId: exports.uuidSchema,
    userId: exports.uuidSchema,
    gameId: exports.uuidSchema,
    fromSeconds: zod_1.z.number().nonnegative().optional(),
    toSeconds: zod_1.z.number().positive().optional(),
    qualityPreset: zod_1.z.enum(['low', 'medium', 'high']).optional(),
});
exports.replayIdParamSchema = zod_1.z.object({
    replayId: exports.uuidSchema,
});
// ============================================================================
// CLIP VALIDATORS
// ============================================================================
exports.clipListQuerySchema = zod_1.z.object({
    pageToken: zod_1.z.string().optional(),
    gameId: exports.uuidSchema.optional(),
    creatorId: exports.uuidSchema.optional(),
    language: zod_1.z.string().length(2).optional(),
    tag: zod_1.z.string().optional(),
});
exports.clipIdParamSchema = zod_1.z.object({
    id: exports.uuidSchema,
});
exports.createClipFromReplayRequestSchema = zod_1.z.object({
    replayId: exports.uuidSchema,
    title: zod_1.z.string().max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
});
// ============================================================================
// FEED VALIDATORS
// ============================================================================
exports.getFeedRequestSchema = zod_1.z.object({
    type: zod_1.z.enum(['for-you', 'following', 'explore']).default('for-you'),
    pageToken: zod_1.z.string().optional(),
    locale: zod_1.z.string().length(2).optional(),
    userId: exports.uuidSchema.optional(),
});
// ============================================================================
// LIVE STREAM VALIDATORS
// ============================================================================
exports.liveStreamListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    gameId: exports.uuidSchema.optional(),
});
exports.liveStreamIdParamSchema = zod_1.z.object({
    id: exports.uuidSchema,
});
// ============================================================================
// CREATOR VALIDATORS
// ============================================================================
exports.creatorListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    search: zod_1.z.string().optional(),
});
exports.creatorHandleParamSchema = zod_1.z.object({
    handle: zod_1.z.string().min(1),
});
// ============================================================================
// PAYMENT VALIDATORS
// ============================================================================
exports.createCheckoutSessionRequestSchema = zod_1.z.object({
    userId: exports.uuidSchema,
    planId: zod_1.z.string().min(1),
    locale: zod_1.z.string().length(2),
    currency: zod_1.z.string().length(3),
    country: zod_1.z.string().length(2),
});
// ============================================================================
// WALLET VALIDATORS
// ============================================================================
exports.walletTransactionQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    type: zod_1.z.enum(['credit', 'debit', 'all']).optional(),
});
// ============================================================================
// ANALYTICS VALIDATORS
// ============================================================================
exports.analyticsEventSchema = zod_1.z.object({
    eventType: zod_1.z.enum([
        'PageView',
        'SignUp',
        'PlaySessionStart',
        'ReplaySaved',
        'ReelPublished',
        'PaymentCompleted',
        'ClipViewed',
        'LiveStreamViewed',
    ]),
    userId: exports.uuidSchema.optional(),
    sessionId: exports.uuidSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    timestamp: exports.isoDateSchema,
});
exports.analyticsMetricsQuerySchema = zod_1.z.object({
    metric: zod_1.z.string().optional(),
    startDate: exports.isoDateSchema.optional(),
    endDate: exports.isoDateSchema.optional(),
});
// ============================================================================
// MODERATION VALIDATORS
// ============================================================================
exports.moderationRequestSchema = zod_1.z.object({
    contentId: zod_1.z.string().min(1),
    contentType: zod_1.z.enum(['text', 'image', 'video']),
    content: zod_1.z.union([zod_1.z.string(), zod_1.z.object({}).passthrough()]),
});
exports.contentFlagRequestSchema = zod_1.z.object({
    contentId: zod_1.z.string().min(1),
    contentType: zod_1.z.enum(['text', 'image', 'video']),
    reason: zod_1.z.string().min(1).max(500),
});
// ============================================================================
// COMMUNITY VALIDATORS
// ============================================================================
exports.communityHubListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    search: zod_1.z.string().optional(),
});
exports.communityHubIdParamSchema = zod_1.z.object({
    hubId: exports.uuidSchema,
});
exports.joinHubRequestSchema = zod_1.z.object({
    hubId: exports.uuidSchema,
});
// ============================================================================
// CHAT VALIDATORS
// ============================================================================
exports.chatChannelListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    type: zod_1.z.enum(['public', 'private', 'dm']).optional(),
});
exports.chatChannelIdParamSchema = zod_1.z.object({
    channelId: exports.uuidSchema,
});
exports.sendMessageRequestSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(2000),
    replyToMessageId: exports.uuidSchema.optional(),
});
exports.chatMessageListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(50),
    before: exports.isoDateSchema.optional(),
});
// ============================================================================
// NOTIFICATION VALIDATORS
// ============================================================================
exports.notificationListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(20),
    type: zod_1.z.enum(['system', 'social', 'game', 'payment', 'all']).optional(),
    unreadOnly: zod_1.z.coerce.boolean().optional(),
});
exports.notificationIdParamSchema = zod_1.z.object({
    id: exports.uuidSchema,
});
// ============================================================================
// VIDEO EDITING VALIDATORS
// ============================================================================
exports.editInstructionsSchema = zod_1.z.object({
    replayId: exports.uuidSchema,
    outputFormat: zod_1.z.enum(['vertical_1080x1920', 'horizontal_1920x1080']).default('vertical_1080x1920'),
    trim: zod_1.z.object({
        start: zod_1.z.number().nonnegative(),
        end: zod_1.z.number().positive(),
    }).optional(),
    filters: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        name: zod_1.z.string(),
    })).optional(),
    texts: zod_1.z.array(zod_1.z.object({
        text: zod_1.z.string(),
        startTime: zod_1.z.number().nonnegative(),
        endTime: zod_1.z.number().positive(),
        position: zod_1.z.object({
            x: zod_1.z.number().min(0).max(1),
            y: zod_1.z.number().min(0).max(1),
        }),
        fontSizeRelative: zod_1.z.number().positive(),
        color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        outlineColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })).optional(),
    stickers: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        startTime: zod_1.z.number().nonnegative(),
        endTime: zod_1.z.number().positive(),
        position: zod_1.z.object({
            x: zod_1.z.number().min(0).max(1),
            y: zod_1.z.number().min(0).max(1),
        }),
        scale: zod_1.z.number().positive().default(1),
    })).optional(),
    audio: zod_1.z.object({
        useGameAudio: zod_1.z.boolean().default(true),
        musicTrackId: zod_1.z.string().optional(),
        ducking: zod_1.z.object({
            gameAudioGain: zod_1.z.number().min(0).max(1).default(0.5),
            musicGain: zod_1.z.number().min(0).max(1).default(1.0),
        }).optional(),
    }).optional(),
});
exports.renderRequestSchema = zod_1.z.object({
    replayId: exports.uuidSchema,
    instructions: exports.editInstructionsSchema,
});
// ============================================================================
// ORCHESTRATOR VALIDATORS
// ============================================================================
exports.findVMRequestSchema = zod_1.z.object({
    region: zod_1.z.string().min(1),
    gameId: exports.uuidSchema,
    maxSessions: zod_1.z.number().int().positive().default(1),
});
exports.vmIdParamSchema = zod_1.z.object({
    vmId: exports.uuidSchema,
});
// ============================================================================
// SEO INDEXER VALIDATORS
// ============================================================================
exports.sitemapQuerySchema = zod_1.z.object({
    locale: zod_1.z.string().length(2).optional(),
});
exports.indexContentRequestSchema = zod_1.z.object({
    contentId: zod_1.z.string().min(1),
    contentType: zod_1.z.enum(['game', 'creator', 'clip', 'landing-page']),
    locale: zod_1.z.string().length(2),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});

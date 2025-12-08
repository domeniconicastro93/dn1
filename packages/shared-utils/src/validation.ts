/**
 * Zod Validation Schemas
 * 
 * Runtime validation for all DTOs using Zod
 */

import { z } from 'zod';

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const isoDateSchema = z.string().datetime();

// ============================================================================
// AUTH VALIDATORS
// ============================================================================

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  locale: z.string().length(2).default('en'),
  marketingConsent: z.boolean().optional(),
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

// ============================================================================
// USER VALIDATORS
// ============================================================================

export const updateUserRequestSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  avatarUrl: urlSchema.optional(),
  locale: z.string().length(2).optional(),
  steamId64: z
    .string()
    .regex(/^\d+$/)
    .min(5)
    .max(32)
    .optional(),
});

// ============================================================================
// GAME VALIDATORS
// ============================================================================

export const gameListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  genre: z.string().optional(),
  search: z.string().optional(),
});

export const gameSlugParamSchema = z.object({
  slug: z.string().min(1),
});

// ============================================================================
// SESSION VALIDATORS
// ============================================================================

export const createSessionRequestSchema = z.object({
  gameId: uuidSchema,
  region: z.string().min(1).optional(),
  deviceInfo: z.record(z.unknown()).optional(),
});

export const sessionIdParamSchema = z.object({
  sessionId: uuidSchema,
});

export const sessionIdParamSchemaAlt = z.object({
  id: uuidSchema,
});

// ============================================================================
// REPLAY VALIDATORS
// ============================================================================

export const saveReplayRequestSchema = z.object({
  sessionId: uuidSchema,
  userId: uuidSchema,
  gameId: uuidSchema,
  fromSeconds: z.number().nonnegative().optional(),
  toSeconds: z.number().positive().optional(),
  qualityPreset: z.enum(['low', 'medium', 'high']).optional(),
});

export const replayIdParamSchema = z.object({
  replayId: uuidSchema,
});

// ============================================================================
// CLIP VALIDATORS
// ============================================================================

export const clipListQuerySchema = z.object({
  pageToken: z.string().optional(),
  gameId: uuidSchema.optional(),
  creatorId: uuidSchema.optional(),
  language: z.string().length(2).optional(),
  tag: z.string().optional(),
});

export const clipIdParamSchema = z.object({
  id: uuidSchema,
});

export const createClipFromReplayRequestSchema = z.object({
  replayId: uuidSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
});

// ============================================================================
// FEED VALIDATORS
// ============================================================================

export const getFeedRequestSchema = z.object({
  type: z.enum(['for-you', 'following', 'explore']).default('for-you'),
  pageToken: z.string().optional(),
  locale: z.string().length(2).optional(),
  userId: uuidSchema.optional(),
});

// ============================================================================
// LIVE STREAM VALIDATORS
// ============================================================================

export const liveStreamListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  gameId: uuidSchema.optional(),
});

export const liveStreamIdParamSchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// CREATOR VALIDATORS
// ============================================================================

export const creatorListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const creatorHandleParamSchema = z.object({
  handle: z.string().min(1),
});

// ============================================================================
// PAYMENT VALIDATORS
// ============================================================================

export const createCheckoutSessionRequestSchema = z.object({
  userId: uuidSchema,
  planId: z.string().min(1),
  locale: z.string().length(2),
  currency: z.string().length(3),
  country: z.string().length(2),
});

// ============================================================================
// WALLET VALIDATORS
// ============================================================================

export const walletTransactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['credit', 'debit', 'all']).optional(),
});

// ============================================================================
// ANALYTICS VALIDATORS
// ============================================================================

export const analyticsEventSchema = z.object({
  eventType: z.enum([
    'PageView',
    'SignUp',
    'PlaySessionStart',
    'ReplaySaved',
    'ReelPublished',
    'PaymentCompleted',
    'ClipViewed',
    'LiveStreamViewed',
  ]),
  userId: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: isoDateSchema,
});

export const analyticsMetricsQuerySchema = z.object({
  metric: z.string().optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
});

// ============================================================================
// MODERATION VALIDATORS
// ============================================================================

export const moderationRequestSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['text', 'image', 'video']),
  content: z.union([z.string(), z.object({}).passthrough()]),
});

export const contentFlagRequestSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['text', 'image', 'video']),
  reason: z.string().min(1).max(500),
});

// ============================================================================
// COMMUNITY VALIDATORS
// ============================================================================

export const communityHubListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const communityHubIdParamSchema = z.object({
  hubId: uuidSchema,
});

export const joinHubRequestSchema = z.object({
  hubId: uuidSchema,
});

// ============================================================================
// CHAT VALIDATORS
// ============================================================================

export const chatChannelListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['public', 'private', 'dm']).optional(),
});

export const chatChannelIdParamSchema = z.object({
  channelId: uuidSchema,
});

export const sendMessageRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  replyToMessageId: uuidSchema.optional(),
});

export const chatMessageListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  before: isoDateSchema.optional(),
});

// ============================================================================
// NOTIFICATION VALIDATORS
// ============================================================================

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['system', 'social', 'game', 'payment', 'all']).optional(),
  unreadOnly: z.coerce.boolean().optional(),
});

export const notificationIdParamSchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// VIDEO EDITING VALIDATORS
// ============================================================================

export const editInstructionsSchema = z.object({
  replayId: uuidSchema,
  outputFormat: z.enum(['vertical_1080x1920', 'horizontal_1920x1080']).default('vertical_1080x1920'),
  trim: z.object({
    start: z.number().nonnegative(),
    end: z.number().positive(),
  }).optional(),
  filters: z.array(z.object({
    type: z.string(),
    name: z.string(),
  })).optional(),
  texts: z.array(z.object({
    text: z.string(),
    startTime: z.number().nonnegative(),
    endTime: z.number().positive(),
    position: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    }),
    fontSizeRelative: z.number().positive(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    outlineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  })).optional(),
  stickers: z.array(z.object({
    name: z.string(),
    startTime: z.number().nonnegative(),
    endTime: z.number().positive(),
    position: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    }),
    scale: z.number().positive().default(1),
  })).optional(),
  audio: z.object({
    useGameAudio: z.boolean().default(true),
    musicTrackId: z.string().optional(),
    ducking: z.object({
      gameAudioGain: z.number().min(0).max(1).default(0.5),
      musicGain: z.number().min(0).max(1).default(1.0),
    }).optional(),
  }).optional(),
});

export const renderRequestSchema = z.object({
  replayId: uuidSchema,
  instructions: editInstructionsSchema,
});

// ============================================================================
// ORCHESTRATOR VALIDATORS
// ============================================================================

export const findVMRequestSchema = z.object({
  region: z.string().min(1),
  gameId: uuidSchema,
  maxSessions: z.number().int().positive().default(1),
});

export const vmIdParamSchema = z.object({
  vmId: uuidSchema,
});

// ============================================================================
// SEO INDEXER VALIDATORS
// ============================================================================

export const sitemapQuerySchema = z.object({
  locale: z.string().length(2).optional(),
});

export const indexContentRequestSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['game', 'creator', 'clip', 'landing-page']),
  locale: z.string().length(2),
  metadata: z.record(z.unknown()).optional(),
});


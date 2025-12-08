/**
 * Zod Validation Schemas
 *
 * Runtime validation for all DTOs using Zod
 */
import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const urlSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const registerRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    locale: z.ZodDefault<z.ZodString>;
    marketingConsent: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    locale: string;
    marketingConsent?: boolean | undefined;
}, {
    email: string;
    password: string;
    locale?: string | undefined;
    marketingConsent?: boolean | undefined;
}>;
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetConfirmSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export declare const updateUserRequestSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    handle: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    steamId64: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    steamId64?: string | undefined;
    locale?: string | undefined;
    displayName?: string | undefined;
    handle?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    steamId64?: string | undefined;
    locale?: string | undefined;
    displayName?: string | undefined;
    handle?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const gameListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    genre: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    genre?: string | undefined;
    search?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    genre?: string | undefined;
    search?: string | undefined;
}>;
export declare const gameSlugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export declare const createSessionRequestSchema: z.ZodObject<{
    gameId: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    deviceInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    gameId: string;
    region?: string | undefined;
    deviceInfo?: Record<string, unknown> | undefined;
}, {
    gameId: string;
    region?: string | undefined;
    deviceInfo?: Record<string, unknown> | undefined;
}>;
export declare const sessionIdParamSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const sessionIdParamSchemaAlt: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const saveReplayRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    gameId: z.ZodString;
    fromSeconds: z.ZodOptional<z.ZodNumber>;
    toSeconds: z.ZodOptional<z.ZodNumber>;
    qualityPreset: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    gameId: string;
    sessionId: string;
    fromSeconds?: number | undefined;
    toSeconds?: number | undefined;
    qualityPreset?: "low" | "medium" | "high" | undefined;
}, {
    userId: string;
    gameId: string;
    sessionId: string;
    fromSeconds?: number | undefined;
    toSeconds?: number | undefined;
    qualityPreset?: "low" | "medium" | "high" | undefined;
}>;
export declare const replayIdParamSchema: z.ZodObject<{
    replayId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    replayId: string;
}, {
    replayId: string;
}>;
export declare const clipListQuerySchema: z.ZodObject<{
    pageToken: z.ZodOptional<z.ZodString>;
    gameId: z.ZodOptional<z.ZodString>;
    creatorId: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gameId?: string | undefined;
    pageToken?: string | undefined;
    creatorId?: string | undefined;
    language?: string | undefined;
    tag?: string | undefined;
}, {
    gameId?: string | undefined;
    pageToken?: string | undefined;
    creatorId?: string | undefined;
    language?: string | undefined;
    tag?: string | undefined;
}>;
export declare const clipIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const createClipFromReplayRequestSchema: z.ZodObject<{
    replayId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    replayId: string;
    title?: string | undefined;
    description?: string | undefined;
}, {
    replayId: string;
    title?: string | undefined;
    description?: string | undefined;
}>;
export declare const getFeedRequestSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["for-you", "following", "explore"]>>;
    pageToken: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "for-you" | "following" | "explore";
    userId?: string | undefined;
    locale?: string | undefined;
    pageToken?: string | undefined;
}, {
    userId?: string | undefined;
    locale?: string | undefined;
    type?: "for-you" | "following" | "explore" | undefined;
    pageToken?: string | undefined;
}>;
export declare const liveStreamListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    gameId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    gameId?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    gameId?: string | undefined;
}>;
export declare const liveStreamIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const creatorListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    search?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
}>;
export declare const creatorHandleParamSchema: z.ZodObject<{
    handle: z.ZodString;
}, "strip", z.ZodTypeAny, {
    handle: string;
}, {
    handle: string;
}>;
export declare const createCheckoutSessionRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    planId: z.ZodString;
    locale: z.ZodString;
    currency: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    locale: string;
    planId: string;
    currency: string;
    country: string;
}, {
    userId: string;
    locale: string;
    planId: string;
    currency: string;
    country: string;
}>;
export declare const walletTransactionQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["credit", "debit", "all"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    type?: "credit" | "debit" | "all" | undefined;
}, {
    type?: "credit" | "debit" | "all" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export declare const analyticsEventSchema: z.ZodObject<{
    eventType: z.ZodEnum<["PageView", "SignUp", "PlaySessionStart", "ReplaySaved", "ReelPublished", "PaymentCompleted", "ClipViewed", "LiveStreamViewed"]>;
    userId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    eventType: "PaymentCompleted" | "ClipViewed" | "ReplaySaved" | "ReelPublished" | "PageView" | "SignUp" | "PlaySessionStart" | "LiveStreamViewed";
    timestamp: string;
    userId?: string | undefined;
    sessionId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    eventType: "PaymentCompleted" | "ClipViewed" | "ReplaySaved" | "ReelPublished" | "PageView" | "SignUp" | "PlaySessionStart" | "LiveStreamViewed";
    timestamp: string;
    userId?: string | undefined;
    sessionId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const analyticsMetricsQuerySchema: z.ZodObject<{
    metric: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    metric?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    metric?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const moderationRequestSchema: z.ZodObject<{
    contentId: z.ZodString;
    contentType: z.ZodEnum<["text", "image", "video"]>;
    content: z.ZodUnion<[z.ZodString, z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>]>;
}, "strip", z.ZodTypeAny, {
    contentId: string;
    contentType: "text" | "image" | "video";
    content: string | z.objectOutputType<{}, z.ZodTypeAny, "passthrough">;
}, {
    contentId: string;
    contentType: "text" | "image" | "video";
    content: string | z.objectInputType<{}, z.ZodTypeAny, "passthrough">;
}>;
export declare const contentFlagRequestSchema: z.ZodObject<{
    contentId: z.ZodString;
    contentType: z.ZodEnum<["text", "image", "video"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    contentId: string;
    contentType: "text" | "image" | "video";
    reason: string;
}, {
    contentId: string;
    contentType: "text" | "image" | "video";
    reason: string;
}>;
export declare const communityHubListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    search?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
}>;
export declare const communityHubIdParamSchema: z.ZodObject<{
    hubId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hubId: string;
}, {
    hubId: string;
}>;
export declare const joinHubRequestSchema: z.ZodObject<{
    hubId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hubId: string;
}, {
    hubId: string;
}>;
export declare const chatChannelListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["public", "private", "dm"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    type?: "public" | "private" | "dm" | undefined;
}, {
    type?: "public" | "private" | "dm" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export declare const chatChannelIdParamSchema: z.ZodObject<{
    channelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    channelId: string;
}, {
    channelId: string;
}>;
export declare const sendMessageRequestSchema: z.ZodObject<{
    text: z.ZodString;
    replyToMessageId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    replyToMessageId?: string | undefined;
}, {
    text: string;
    replyToMessageId?: string | undefined;
}>;
export declare const chatMessageListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    before: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    before?: string | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
    before?: string | undefined;
}>;
export declare const notificationListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["system", "social", "game", "payment", "all"]>>;
    unreadOnly: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    type?: "all" | "system" | "social" | "game" | "payment" | undefined;
    unreadOnly?: boolean | undefined;
}, {
    type?: "all" | "system" | "social" | "game" | "payment" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    unreadOnly?: boolean | undefined;
}>;
export declare const notificationIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const editInstructionsSchema: z.ZodObject<{
    replayId: z.ZodString;
    outputFormat: z.ZodDefault<z.ZodEnum<["vertical_1080x1920", "horizontal_1920x1080"]>>;
    trim: z.ZodOptional<z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>>;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
    }, {
        type: string;
        name: string;
    }>, "many">>;
    texts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        startTime: z.ZodNumber;
        endTime: z.ZodNumber;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            y: number;
            x: number;
        }, {
            y: number;
            x: number;
        }>;
        fontSizeRelative: z.ZodNumber;
        color: z.ZodString;
        outlineColor: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        fontSizeRelative: number;
        color: string;
        outlineColor?: string | undefined;
    }, {
        text: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        fontSizeRelative: number;
        color: string;
        outlineColor?: string | undefined;
    }>, "many">>;
    stickers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        startTime: z.ZodNumber;
        endTime: z.ZodNumber;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            y: number;
            x: number;
        }, {
            y: number;
            x: number;
        }>;
        scale: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        scale: number;
    }, {
        name: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        scale?: number | undefined;
    }>, "many">>;
    audio: z.ZodOptional<z.ZodObject<{
        useGameAudio: z.ZodDefault<z.ZodBoolean>;
        musicTrackId: z.ZodOptional<z.ZodString>;
        ducking: z.ZodOptional<z.ZodObject<{
            gameAudioGain: z.ZodDefault<z.ZodNumber>;
            musicGain: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            gameAudioGain: number;
            musicGain: number;
        }, {
            gameAudioGain?: number | undefined;
            musicGain?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        useGameAudio: boolean;
        musicTrackId?: string | undefined;
        ducking?: {
            gameAudioGain: number;
            musicGain: number;
        } | undefined;
    }, {
        useGameAudio?: boolean | undefined;
        musicTrackId?: string | undefined;
        ducking?: {
            gameAudioGain?: number | undefined;
            musicGain?: number | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    replayId: string;
    outputFormat: "vertical_1080x1920" | "horizontal_1920x1080";
    trim?: {
        start: number;
        end: number;
    } | undefined;
    filters?: {
        type: string;
        name: string;
    }[] | undefined;
    texts?: {
        text: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        fontSizeRelative: number;
        color: string;
        outlineColor?: string | undefined;
    }[] | undefined;
    stickers?: {
        name: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        scale: number;
    }[] | undefined;
    audio?: {
        useGameAudio: boolean;
        musicTrackId?: string | undefined;
        ducking?: {
            gameAudioGain: number;
            musicGain: number;
        } | undefined;
    } | undefined;
}, {
    replayId: string;
    outputFormat?: "vertical_1080x1920" | "horizontal_1920x1080" | undefined;
    trim?: {
        start: number;
        end: number;
    } | undefined;
    filters?: {
        type: string;
        name: string;
    }[] | undefined;
    texts?: {
        text: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        fontSizeRelative: number;
        color: string;
        outlineColor?: string | undefined;
    }[] | undefined;
    stickers?: {
        name: string;
        startTime: number;
        endTime: number;
        position: {
            y: number;
            x: number;
        };
        scale?: number | undefined;
    }[] | undefined;
    audio?: {
        useGameAudio?: boolean | undefined;
        musicTrackId?: string | undefined;
        ducking?: {
            gameAudioGain?: number | undefined;
            musicGain?: number | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const renderRequestSchema: z.ZodObject<{
    replayId: z.ZodString;
    instructions: z.ZodObject<{
        replayId: z.ZodString;
        outputFormat: z.ZodDefault<z.ZodEnum<["vertical_1080x1920", "horizontal_1920x1080"]>>;
        trim: z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>>;
        filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
        }, {
            type: string;
            name: string;
        }>, "many">>;
        texts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            startTime: z.ZodNumber;
            endTime: z.ZodNumber;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                y: number;
                x: number;
            }, {
                y: number;
                x: number;
            }>;
            fontSizeRelative: z.ZodNumber;
            color: z.ZodString;
            outlineColor: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            fontSizeRelative: number;
            color: string;
            outlineColor?: string | undefined;
        }, {
            text: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            fontSizeRelative: number;
            color: string;
            outlineColor?: string | undefined;
        }>, "many">>;
        stickers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            startTime: z.ZodNumber;
            endTime: z.ZodNumber;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                y: number;
                x: number;
            }, {
                y: number;
                x: number;
            }>;
            scale: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            scale: number;
        }, {
            name: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            scale?: number | undefined;
        }>, "many">>;
        audio: z.ZodOptional<z.ZodObject<{
            useGameAudio: z.ZodDefault<z.ZodBoolean>;
            musicTrackId: z.ZodOptional<z.ZodString>;
            ducking: z.ZodOptional<z.ZodObject<{
                gameAudioGain: z.ZodDefault<z.ZodNumber>;
                musicGain: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                gameAudioGain: number;
                musicGain: number;
            }, {
                gameAudioGain?: number | undefined;
                musicGain?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            useGameAudio: boolean;
            musicTrackId?: string | undefined;
            ducking?: {
                gameAudioGain: number;
                musicGain: number;
            } | undefined;
        }, {
            useGameAudio?: boolean | undefined;
            musicTrackId?: string | undefined;
            ducking?: {
                gameAudioGain?: number | undefined;
                musicGain?: number | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        replayId: string;
        outputFormat: "vertical_1080x1920" | "horizontal_1920x1080";
        trim?: {
            start: number;
            end: number;
        } | undefined;
        filters?: {
            type: string;
            name: string;
        }[] | undefined;
        texts?: {
            text: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            fontSizeRelative: number;
            color: string;
            outlineColor?: string | undefined;
        }[] | undefined;
        stickers?: {
            name: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            scale: number;
        }[] | undefined;
        audio?: {
            useGameAudio: boolean;
            musicTrackId?: string | undefined;
            ducking?: {
                gameAudioGain: number;
                musicGain: number;
            } | undefined;
        } | undefined;
    }, {
        replayId: string;
        outputFormat?: "vertical_1080x1920" | "horizontal_1920x1080" | undefined;
        trim?: {
            start: number;
            end: number;
        } | undefined;
        filters?: {
            type: string;
            name: string;
        }[] | undefined;
        texts?: {
            text: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            fontSizeRelative: number;
            color: string;
            outlineColor?: string | undefined;
        }[] | undefined;
        stickers?: {
            name: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            scale?: number | undefined;
        }[] | undefined;
        audio?: {
            useGameAudio?: boolean | undefined;
            musicTrackId?: string | undefined;
            ducking?: {
                gameAudioGain?: number | undefined;
                musicGain?: number | undefined;
            } | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    replayId: string;
    instructions: {
        replayId: string;
        outputFormat: "vertical_1080x1920" | "horizontal_1920x1080";
        trim?: {
            start: number;
            end: number;
        } | undefined;
        filters?: {
            type: string;
            name: string;
        }[] | undefined;
        texts?: {
            text: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            fontSizeRelative: number;
            color: string;
            outlineColor?: string | undefined;
        }[] | undefined;
        stickers?: {
            name: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            scale: number;
        }[] | undefined;
        audio?: {
            useGameAudio: boolean;
            musicTrackId?: string | undefined;
            ducking?: {
                gameAudioGain: number;
                musicGain: number;
            } | undefined;
        } | undefined;
    };
}, {
    replayId: string;
    instructions: {
        replayId: string;
        outputFormat?: "vertical_1080x1920" | "horizontal_1920x1080" | undefined;
        trim?: {
            start: number;
            end: number;
        } | undefined;
        filters?: {
            type: string;
            name: string;
        }[] | undefined;
        texts?: {
            text: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            fontSizeRelative: number;
            color: string;
            outlineColor?: string | undefined;
        }[] | undefined;
        stickers?: {
            name: string;
            startTime: number;
            endTime: number;
            position: {
                y: number;
                x: number;
            };
            scale?: number | undefined;
        }[] | undefined;
        audio?: {
            useGameAudio?: boolean | undefined;
            musicTrackId?: string | undefined;
            ducking?: {
                gameAudioGain?: number | undefined;
                musicGain?: number | undefined;
            } | undefined;
        } | undefined;
    };
}>;
export declare const findVMRequestSchema: z.ZodObject<{
    region: z.ZodString;
    gameId: z.ZodString;
    maxSessions: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    gameId: string;
    region: string;
    maxSessions: number;
}, {
    gameId: string;
    region: string;
    maxSessions?: number | undefined;
}>;
export declare const vmIdParamSchema: z.ZodObject<{
    vmId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    vmId: string;
}, {
    vmId: string;
}>;
export declare const sitemapQuerySchema: z.ZodObject<{
    locale: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locale?: string | undefined;
}, {
    locale?: string | undefined;
}>;
export declare const indexContentRequestSchema: z.ZodObject<{
    contentId: z.ZodString;
    contentType: z.ZodEnum<["game", "creator", "clip", "landing-page"]>;
    locale: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    locale: string;
    contentId: string;
    contentType: "game" | "creator" | "clip" | "landing-page";
    metadata?: Record<string, unknown> | undefined;
}, {
    locale: string;
    contentId: string;
    contentType: "game" | "creator" | "clip" | "landing-page";
    metadata?: Record<string, unknown> | undefined;
}>;

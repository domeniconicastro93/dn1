/**
 * Shared Types and DTOs for Strike Gaming Cloud
 *
 * All DTOs follow the Master Prompt specifications
 */
export interface ApiResponse<T> {
    data: T;
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
        pageToken?: string;
        [key: string]: unknown;
    };
}
export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export type ApiResponseEnvelope<T> = ApiResponse<T> | ApiError;
export interface RegisterRequestDTO {
    email: string;
    password: string;
    locale: string;
    marketingConsent?: boolean;
}
export interface RegisterResponseDTO {
    userId: string;
    accessToken: string;
    refreshToken: string;
}
export interface LoginRequestDTO {
    email: string;
    password: string;
}
export interface LoginResponseDTO {
    userId: string;
    accessToken: string;
    refreshToken: string;
}
export interface RefreshTokenRequestDTO {
    refreshToken: string;
}
export interface RefreshTokenResponseDTO {
    accessToken: string;
    refreshToken: string;
}
export interface ForgotPasswordRequestDTO {
    email: string;
}
export interface ResetPasswordRequestDTO {
    token: string;
    newPassword: string;
}
export interface UserDTO {
    id: string;
    email: string;
    handle?: string;
    displayName?: string;
    avatarUrl?: string;
    locale: string;
    steamId64?: string;
    createdAt: string;
    updatedAt: string;
}
export interface UpdateUserRequestDTO {
    displayName?: string;
    handle?: string;
    avatarUrl?: string;
    locale?: string;
    steamId64?: string;
}
export interface GameDTO {
    id: string;
    slug: string;
    steamAppId?: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    coverImageUrl?: string;
    genre: string[];
    rating?: number;
    releaseDate?: string;
    developer?: string;
    publisher?: string;
    targetResolution?: '1080p' | '1440p' | '4K';
    targetFPS?: 60 | 120 | 240;
    bitrateRange?: {
        min: number;
        max: number;
    };
    encoderPreset?: string;
    maxConcurrentSessionsPerVM?: number;
    createdAt: string;
    updatedAt: string;
}
export interface GameListResponseDTO {
    games: GameDTO[];
    total: number;
    page: number;
    pageSize: number;
}
export interface CreateSessionRequestDTO {
    gameId: string;
    region?: string;
    deviceInfo?: {
        platform: string;
        resolution?: string;
    };
}
export interface SessionDTO {
    id: string;
    gameId: string;
    userId: string;
    streamUrl: string;
    controlChannelUrl: string;
    status: 'starting' | 'active' | 'paused' | 'ended' | 'error';
    startedAt: string;
    endedAt?: string;
    vmId?: string;
    region: string;
}
export interface EndSessionRequestDTO {
    sessionId: string;
}
export interface SaveReplayRequestDTO {
    sessionId: string;
    userId: string;
    gameId: string;
    fromSeconds?: number;
    toSeconds?: number;
    qualityPreset?: 'low' | 'medium' | 'high';
}
export interface ReplayResponseDTO {
    replayId: string;
    status: 'processing' | 'ready' | 'failed';
    storageUrl?: string;
    estimatedTime?: number;
}
export interface ReplayStatusResponseDTO {
    replayId: string;
    status: 'processing' | 'ready' | 'failed';
    storageUrl?: string;
    progress?: number;
}
export interface EditInstructionsDTO {
    replayId: string;
    outputFormat: 'vertical_1080x1920' | 'horizontal_1920x1080';
    trim?: {
        start: number;
        end: number;
    };
    filters?: Array<{
        type: 'color';
        name: string;
    }>;
    texts?: Array<{
        text: string;
        startTime: number;
        endTime: number;
        position: {
            x: number;
            y: number;
        };
        fontSizeRelative: number;
        color: string;
        outlineColor?: string;
    }>;
    stickers?: Array<{
        name: string;
        startTime: number;
        endTime: number;
        position: {
            x: number;
            y: number;
        };
        scale?: number;
    }>;
    audio?: {
        useGameAudio: boolean;
        musicTrackId?: string;
        ducking?: {
            gameAudioGain: number;
            musicGain: number;
        };
    };
}
export interface RenderRequestDTO {
    replayId: string;
    instructions: EditInstructionsDTO;
}
export interface RenderResponseDTO {
    renderId: string;
    status: 'queued' | 'processing' | 'ready' | 'failed';
    reelId?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    estimatedTime?: number;
}
export interface ClipDTO {
    id: string;
    title?: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl: string;
    gameId: string;
    gameTitle: string;
    creatorId: string;
    creatorHandle: string;
    creatorAvatarUrl?: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    createdAt: string;
    duration: number;
    status: 'pending' | 'published' | 'hidden';
    language?: string;
}
export interface ClipListResponseDTO {
    clips: ClipDTO[];
    total: number;
    pageToken?: string;
}
export interface CreateClipFromReplayRequestDTO {
    replayId: string;
    title?: string;
    description?: string;
}
export interface FeedItemDTO {
    type: 'clip' | 'live';
    clip?: ClipDTO;
    live?: LiveStreamDTO;
    score?: number;
}
export interface FeedResponseDTO {
    items: FeedItemDTO[];
    nextPageToken?: string;
}
export interface GetFeedRequestDTO {
    type: 'for-you' | 'following' | 'explore';
    pageToken?: string;
    locale?: string;
}
export interface LiveStreamDTO {
    id: string;
    title: string;
    thumbnailUrl: string;
    streamUrl: string;
    gameId: string;
    gameTitle: string;
    creatorId: string;
    creatorHandle: string;
    creatorAvatarUrl?: string;
    viewerCount: number;
    startedAt: string;
    isLive: boolean;
}
export interface LiveStreamListResponseDTO {
    streams: LiveStreamDTO[];
    total: number;
    page: number;
    pageSize: number;
}
export interface CreatorDTO {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    clipCount: number;
    isVerified?: boolean;
    trustScore?: number;
    qualityScore?: number;
}
export interface CreateCheckoutSessionRequestDTO {
    userId: string;
    planId: string;
    locale: string;
    currency: string;
    country: string;
}
export interface CheckoutSessionResponseDTO {
    sessionId: string;
    url: string;
}
export interface PaymentWebhookDTO {
    type: string;
    data: {
        object: {
            id: string;
            customer: string;
            amount: number;
            currency: string;
            status: string;
            [key: string]: unknown;
        };
    };
}
export interface WalletDTO {
    userId: string;
    balance: number;
    currency: string;
    updatedAt: string;
}
export interface TransactionDTO {
    id: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    description?: string;
    createdAt: string;
}
export interface TransactionListResponseDTO {
    transactions: TransactionDTO[];
    total: number;
    page: number;
    pageSize: number;
}
export interface AnalyticsEventDTO {
    eventType: 'PageView' | 'SignUp' | 'PlaySessionStart' | 'ReplaySaved' | 'ReelPublished' | 'PaymentCompleted' | 'ClipViewed' | 'LiveStreamViewed';
    userId?: string;
    sessionId?: string;
    properties?: Record<string, unknown>;
    timestamp: string;
}
export interface ModerationRequestDTO {
    contentId: string;
    contentType: 'text' | 'image' | 'video';
    content: string;
}
export interface ModerationResponseDTO {
    contentId: string;
    flagged: boolean;
    categories?: string[];
    scores?: {
        hate?: number;
        harassment?: number;
        selfHarm?: number;
        nsfw?: number;
        violence?: number;
    };
    action?: 'hide' | 'age-restrict' | 'shadowban' | 'manual-review';
}
export interface CreateVMRequestDTO {
    templateId: string;
    region: string;
}
export interface CreateVMResponseDTO {
    vmId: string;
    status: 'provisioning' | 'booting' | 'ready' | 'error';
}
export interface AssignSessionToVMRequestDTO {
    sessionId: string;
    vmId: string;
}
export interface VMDTO {
    id: string;
    templateId: string;
    region: string;
    status: 'TEMPLATE' | 'PROVISIONING' | 'BOOTING' | 'READY' | 'IN_USE' | 'DRAINING' | 'ERROR' | 'TERMINATED';
    currentSessions: number;
    maxSessions: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreatorStatsDTO {
    creatorId: string;
    totalClips: number;
    totalViews: number;
    totalLikes: number;
    totalFollowers: number;
    totalFollowing: number;
    averageWatchTime: number;
    topGames: Array<{
        gameId: string;
        gameName: string;
        clipCount: number;
    }>;
}
export interface CreatorListResponseDTO {
    creators: CreatorDTO[];
    total: number;
    pageToken?: string;
}
export interface CommunityHubDTO {
    id: string;
    name: string;
    description?: string;
    gameId?: string;
    language?: string;
    memberCount: number;
    channelCount: number;
    avatarUrl?: string;
    bannerUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CommunityChannelDTO {
    id: string;
    hubId: string;
    name: string;
    description?: string;
    type: 'text' | 'voice' | 'announcement';
    memberCount: number;
    createdAt: string;
}
export interface CommunityEventDTO {
    id: string;
    hubId: string;
    title: string;
    description?: string;
    type: 'tournament' | 'stream' | 'meetup' | 'other';
    startTime: string;
    endTime?: string;
    status: 'upcoming' | 'live' | 'past';
    participantCount: number;
    createdAt: string;
}
export interface CommunityHubListResponseDTO {
    hubs: CommunityHubDTO[];
    total: number;
    pageToken?: string;
}
export interface ChatChannelDTO {
    id: string;
    name: string;
    type: 'live' | 'hub' | 'direct';
    participantCount: number;
    lastMessageAt?: string;
    createdAt: string;
}
export interface ChatMessageDTO {
    id: string;
    channelId: string;
    userId: string;
    text: string;
    replyToMessageId?: string;
    createdAt: string;
}
export interface SendMessageRequestDTO {
    text: string;
    replyToMessageId?: string;
}
export interface ChatMessageListResponseDTO {
    messages: ChatMessageDTO[];
    total: number;
    pageToken?: string;
}
export interface NotificationDTO {
    id: string;
    userId: string;
    type: 'system' | 'social' | 'game' | 'payment';
    title: string;
    body?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    read: boolean;
    createdAt: string;
}
export interface CreateNotificationRequestDTO {
    userId: string;
    type: 'system' | 'social' | 'game' | 'payment';
    title: string;
    body?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}
export interface MarkNotificationReadRequestDTO {
    notificationId: string;
}
export interface NotificationListResponseDTO {
    notifications: NotificationDTO[];
    total: number;
    unreadCount: number;
    pageToken?: string;
}
export interface SitemapEntryDTO {
    loc: string;
    lastmod: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
    hreflang?: Array<{
        lang: string;
        href: string;
    }>;
}
export interface SitemapIndexDTO {
    sitemaps: Array<{
        loc: string;
        lastmod: string;
    }>;
}
export interface SEOIndexRequestDTO {
    contentType: 'game' | 'creator' | 'clip' | 'landing-page';
    contentId: string;
    action: 'create' | 'update' | 'delete';
}
export type { SteamExecutableMapping, SteamInstalledGameDTO, SteamLibraryResponseDTO, SteamLibrarySyncResponseDTO, SteamWebMetadata, SteamGameStatus, SteamLibraryRawEntry } from './steam-library';
export { STEAM_SUNSHINE_MAPPING, findSteamExecutableMapping } from './steam-mapping';
export type { SteamOwnedGameDTO, SteamOwnedLibraryResponse, SteamProfileDTO, SteamUserLibraryEntry, SteamUserLibraryResponse, SteamUserLibraryStatus, } from './steam-user';

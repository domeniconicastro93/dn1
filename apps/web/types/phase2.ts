/**
 * PHASE 2 - Temporary Type Definitions
 * 
 * These types are placeholders until backend DTOs are defined in Phase 4.
 * All types marked with TODO should be replaced with actual DTOs from backend services.
 */

// ============================================================================
// GAME TYPES
// ============================================================================

export interface Game {
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
  // TODO: Replace with GameDTO from game-service
}

export interface GameListResponse {
  games: Game[];
  total: number;
  page: number;
  pageSize: number;
  // TODO: Replace with GameListResponseDTO from game-service
}

// ============================================================================
// CLIP/REEL TYPES
// ============================================================================

export interface Clip {
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
  duration: number; // in seconds
  // TODO: Replace with ClipDTO from clip-service
}

export interface ClipListResponse {
  clips: Clip[];
  total: number;
  pageToken?: string;
  // TODO: Replace with ClipListResponseDTO from clip-service
}

// ============================================================================
// FEED TYPES
// ============================================================================

export interface FeedItem {
  type: 'clip' | 'live';
  clip?: Clip;
  live?: LiveStream;
  // TODO: Replace with FeedItemDTO from feed-service
}

export interface FeedResponse {
  items: FeedItem[];
  nextPageToken?: string;
  // TODO: Replace with FeedResponseDTO from feed-service
}

// ============================================================================
// LIVE STREAM TYPES
// ============================================================================

export interface LiveStream {
  id: string;
  title: string;
  thumbnailUrl: string;
  streamUrl: string; // WebRTC/HLS URL
  gameId: string;
  gameTitle: string;
  creatorId: string;
  creatorHandle: string;
  creatorAvatarUrl?: string;
  viewerCount: number;
  startedAt: string;
  isLive: boolean;
  // TODO: Replace with LiveStreamDTO from streaming-service
}

// ============================================================================
// CREATOR TYPES
// ============================================================================

export interface Creator {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  clipCount: number;
  isVerified?: boolean;
  // TODO: Replace with CreatorDTO from creator-service
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface GameSession {
  id: string;
  gameId: string;
  userId: string;
  streamUrl: string; // WebRTC URL
  controlChannelUrl: string; // WebSocket URL for controls
  status: 'starting' | 'active' | 'paused' | 'ended' | 'error';
  startedAt: string;
  host?: string;
  port?: number;
  udpPorts?: number[];
  protocol?: string;
  useHttps?: boolean;
  appId?: string;
  // TODO: Replace with SessionDTO from session-service
}

// ============================================================================
// REPLAY TYPES
// ============================================================================

export interface ReplayRequest {
  sessionId: string;
  userId: string;
  gameId: string;
  fromSeconds?: number; // Optional: start time in replay buffer
  toSeconds?: number; // Optional: end time in replay buffer
  qualityPreset?: 'low' | 'medium' | 'high';
  // TODO: Replace with SaveReplayRequestDTO from replay-engine-service
}

export interface ReplayResponse {
  replayId: string;
  status: 'processing' | 'ready' | 'failed';
  storageUrl?: string; // Available when status is 'ready'
  estimatedTime?: number; // seconds until ready
  // TODO: Replace with ReplayResponseDTO from replay-engine-service
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  handle?: string;
  displayName?: string;
  avatarUrl?: string;
  locale: string;
  // TODO: Replace with UserDTO from user-service
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
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


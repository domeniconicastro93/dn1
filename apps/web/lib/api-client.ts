/**
 * PHASE 2 - Mock API Client
 * 
 * This is a placeholder API client that returns mock data.
 * In Phase 4, this will be replaced with actual API calls to backend services.
 */

import type {
  Game,
  GameListResponse,
  Clip,
  ClipListResponse,
  FeedItem,
  FeedResponse,
  LiveStream,
  Creator,
  GameSession,
  ReplayRequest,
  ReplayResponse,
  ApiResponse,
  ApiError,
} from '@/types/phase2';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // TODO: Replace with actual API calls in Phase 4
  // For now, return mock data
  throw new Error('API client not implemented yet. Use mock functions.');
}

// ============================================================================
// GAME API
// ============================================================================

export async function getGames(params?: {
  page?: number;
  pageSize?: number;
  genre?: string;
  search?: string;
}): Promise<GameListResponse> {
  // Mock implementation
  return {
    games: [],
    total: 0,
    page: params?.page || 1,
    pageSize: params?.pageSize || 20,
  };
}

export async function getGame(slug: string): Promise<Game | null> {
  // Mock implementation
  return null;
}

// ============================================================================
// CLIP API
// ============================================================================

export async function getClips(params?: {
  pageToken?: string;
  gameId?: string;
  creatorId?: string;
  language?: string;
}): Promise<ClipListResponse> {
  // Mock implementation
  return {
    clips: [],
    total: 0,
  };
}

export async function getClip(id: string): Promise<Clip | null> {
  // Mock implementation
  return null;
}

// ============================================================================
// FEED API
// ============================================================================

export async function getFeed(params?: {
  type?: 'for-you' | 'following' | 'explore';
  pageToken?: string;
  locale?: string;
}): Promise<FeedResponse> {
  // Mock implementation
  return {
    items: [],
  };
}

// ============================================================================
// LIVE STREAM API
// ============================================================================

export async function getLiveStreams(params?: {
  page?: number;
  pageSize?: number;
  gameId?: string;
}): Promise<LiveStream[]> {
  // Mock implementation
  return [];
}

export async function getLiveStream(id: string): Promise<LiveStream | null> {
  // Mock implementation
  return null;
}

// ============================================================================
// CREATOR API
// ============================================================================

export async function getCreator(handle: string): Promise<Creator | null> {
  // Mock implementation
  return null;
}

// ============================================================================
// SESSION API
// ============================================================================

export async function createSession(params: {
  gameId: string;
  region?: string;
}): Promise<GameSession> {
  // Mock implementation
  throw new Error('Session creation not implemented yet');
}

export async function getSession(sessionId: string): Promise<GameSession | null> {
  // Mock implementation
  return null;
}

export async function endSession(sessionId: string): Promise<void> {
  // Mock implementation
}

// ============================================================================
// REPLAY API
// ============================================================================

export async function saveReplay(
  request: ReplayRequest
): Promise<ReplayResponse> {
  // Mock implementation - returns immediately with processing status
  return {
    replayId: `replay_${Date.now()}`,
    status: 'processing',
    estimatedTime: 30,
  };
}

export async function getReplayStatus(
  replayId: string
): Promise<ReplayResponse> {
  // Mock implementation
  return {
    replayId,
    status: 'ready',
    storageUrl: `https://storage.strike.gg/replays/${replayId}.mp4`,
  };
}


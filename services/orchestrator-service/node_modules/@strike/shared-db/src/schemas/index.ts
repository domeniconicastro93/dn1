/**
 * Database Schemas for Strike Gaming Cloud
 * 
 * These are TypeScript type definitions for database tables.
 * Actual SQL migrations will be created in Phase 9 (Infrastructure).
 */

// ============================================================================
// AUTH SCHEMA
// ============================================================================

export interface UserTable {
  id: string; // UUID
  email: string; // UNIQUE
  password_hash: string;
  handle?: string; // UNIQUE, nullable
  display_name?: string;
  avatar_url?: string;
  locale: string; // default 'en'
  marketing_consent: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  token: string; // UNIQUE
  expires_at: Date;
  created_at: Date;
}

export interface PasswordResetTokenTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  token: string; // UNIQUE
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

// ============================================================================
// GAME SCHEMA
// ============================================================================

export interface GameTable {
  id: string; // UUID
  slug: string; // UNIQUE
  title: string;
  description: string;
  thumbnail_url: string;
  cover_image_url?: string;
  genre: string[]; // JSON array
  rating?: number;
  release_date?: Date;
  developer?: string;
  publisher?: string;
  target_resolution?: '1080p' | '1440p' | '4K';
  target_fps?: 60 | 120 | 240;
  bitrate_range?: { min: number; max: number }; // JSON
  encoder_preset?: string;
  max_concurrent_sessions_per_vm?: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// SESSION SCHEMA
// ============================================================================

export interface SessionTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  game_id: string; // FK to games.id
  vm_id?: string; // FK to vms.id
  stream_url: string;
  control_channel_url: string;
  status: 'starting' | 'active' | 'paused' | 'ended' | 'error';
  region: string;
  started_at: Date;
  ended_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ORCHESTRATOR SCHEMA
// ============================================================================

export interface VMTemplateTable {
  id: string; // UUID
  name: string;
  gpu_type: string; // e.g., 'L4-360', 'RTX-4080'
  vcpu: number;
  ram_gb: number;
  vram_gb: number;
  max_concurrent_sessions: number;
  suggested_fps_range?: { min: number; max: number }; // JSON
  suggested_bitrate_range?: { min: number; max: number }; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface VMTable {
  id: string; // UUID
  template_id: string; // FK to vm_templates.id
  region: string;
  status:
    | 'TEMPLATE'
    | 'PROVISIONING'
    | 'BOOTING'
    | 'READY'
    | 'IN_USE'
    | 'DRAINING'
    | 'ERROR'
    | 'TERMINATED';
  current_sessions: number;
  max_sessions: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// REPLAY SCHEMA
// ============================================================================

export interface ReplayTable {
  id: string; // UUID
  session_id: string; // FK to sessions.id
  user_id: string; // FK to users.id
  game_id: string; // FK to games.id
  storage_url: string;
  status: 'processing' | 'ready' | 'failed';
  from_seconds?: number;
  to_seconds?: number;
  quality_preset?: 'low' | 'medium' | 'high';
  progress?: number; // 0-100
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// ============================================================================
// VIDEO EDITING SCHEMA
// ============================================================================

export interface RenderJobTable {
  id: string; // UUID
  replay_id: string; // FK to replays.id
  user_id: string; // FK to users.id
  instructions: Record<string, unknown>; // JSON (EditInstructionsDTO)
  status: 'queued' | 'processing' | 'ready' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  reel_id?: string; // FK to clips.id (when published)
  progress?: number; // 0-100
  estimated_time?: number; // seconds
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// ============================================================================
// CLIP SCHEMA
// ============================================================================

export interface ClipTable {
  id: string; // UUID
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url: string;
  game_id: string; // FK to games.id
  creator_id: string; // FK to users.id
  replay_id?: string; // FK to replays.id
  render_job_id?: string; // FK to render_jobs.id
  views: number; // default 0
  likes: number; // default 0
  shares: number; // default 0
  comments: number; // default 0
  duration: number; // seconds
  status: 'pending' | 'published' | 'hidden';
  language?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClipLikeTable {
  id: string; // UUID
  clip_id: string; // FK to clips.id
  user_id: string; // FK to users.id
  created_at: Date;
  // UNIQUE constraint on (clip_id, user_id)
}

// ============================================================================
// FEED SCHEMA
// ============================================================================

export interface FeedItemTable {
  id: string; // UUID
  type: 'clip' | 'live';
  clip_id?: string; // FK to clips.id
  live_stream_id?: string; // FK to live_streams.id
  score?: number; // recommendation score
  created_at: Date;
}

// ============================================================================
// LIVE STREAM SCHEMA
// ============================================================================

export interface LiveStreamTable {
  id: string; // UUID
  title: string;
  thumbnail_url: string;
  stream_url: string; // WebRTC/HLS URL
  game_id: string; // FK to games.id
  creator_id: string; // FK to users.id
  viewer_count: number; // default 0
  started_at: Date;
  ended_at?: Date;
  is_live: boolean; // default true
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// CREATOR SCHEMA
// ============================================================================

export interface CreatorTable {
  id: string; // UUID (same as users.id)
  user_id: string; // FK to users.id, UNIQUE
  handle: string; // UNIQUE
  display_name: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number; // default 0
  following_count: number; // default 0
  clip_count: number; // default 0
  is_verified: boolean; // default false
  trust_score?: number; // 0-1, from moderation
  quality_score?: number; // 0-1, from moderation
  created_at: Date;
  updated_at: Date;
}

export interface FollowTable {
  id: string; // UUID
  follower_id: string; // FK to users.id
  following_id: string; // FK to users.id
  created_at: Date;
  // UNIQUE constraint on (follower_id, following_id)
}

// ============================================================================
// PAYMENT SCHEMA
// ============================================================================

export interface PaymentTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  plan_id: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  country: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// ============================================================================
// WALLET SCHEMA
// ============================================================================

export interface WalletTable {
  id: string; // UUID
  user_id: string; // FK to users.id, UNIQUE
  balance: number; // default 0
  currency: string; // default 'USD'
  created_at: Date;
  updated_at: Date;
}

export interface TransactionTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  wallet_id: string; // FK to wallets.id
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  payment_id?: string; // FK to payments.id
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ANALYTICS SCHEMA
// ============================================================================

export interface AnalyticsEventTable {
  id: string; // UUID
  event_type:
    | 'PageView'
    | 'SignUp'
    | 'PlaySessionStart'
    | 'ReplaySaved'
    | 'ReelPublished'
    | 'PaymentCompleted'
    | 'ClipViewed'
    | 'LiveStreamViewed';
  user_id?: string; // FK to users.id
  session_id?: string; // FK to sessions.id
  properties?: Record<string, unknown>; // JSON
  timestamp: Date;
  created_at: Date;
}

// ============================================================================
// MODERATION SCHEMA
// ============================================================================

export interface ModerationCheckTable {
  id: string; // UUID
  content_id: string;
  content_type: 'text' | 'image' | 'video';
  flagged: boolean;
  categories?: string[]; // JSON array
  scores?: Record<string, number>; // JSON (hate, harassment, etc.)
  action?: 'hide' | 'age-restrict' | 'shadowban' | 'manual-review';
  created_at: Date;
}

export interface ContentFlagTable {
  id: string; // UUID
  content_id: string;
  content_type: 'text' | 'image' | 'video';
  flagged_by_user_id: string; // FK to users.id
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: Date;
  reviewed_at?: Date;
}

// ============================================================================
// CREATOR SCHEMA (Extended)
// ============================================================================

export interface CreatorFollowTable {
  id: string; // UUID
  follower_id: string; // FK to users.id
  creator_id: string; // FK to creators.id
  created_at: Date;
  UNIQUE: ['follower_id', 'creator_id'];
}

export interface CreatorStatsTable {
  creator_id: string; // FK to creators.id
  total_clips: number;
  total_views: number;
  total_likes: number;
  total_followers: number;
  total_following: number;
  average_watch_time: number; // seconds
  updated_at: Date;
}

// ============================================================================
// COMMUNITY SCHEMA
// ============================================================================

export interface CommunityHubTable {
  id: string; // UUID
  name: string;
  description?: string;
  game_id?: string; // FK to games.id
  language?: string;
  member_count: number; // default 0
  channel_count: number; // default 0
  avatar_url?: string;
  banner_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CommunityChannelTable {
  id: string; // UUID
  hub_id: string; // FK to community_hubs.id
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  member_count: number; // default 0
  created_at: Date;
  updated_at: Date;
}

export interface CommunityEventTable {
  id: string; // UUID
  hub_id: string; // FK to community_hubs.id
  title: string;
  description?: string;
  type: 'tournament' | 'stream' | 'meetup' | 'other';
  start_time: Date;
  end_time?: Date;
  status: 'upcoming' | 'live' | 'past';
  participant_count: number; // default 0
  created_at: Date;
  updated_at: Date;
}

export interface CommunityHubMemberTable {
  id: string; // UUID
  hub_id: string; // FK to community_hubs.id
  user_id: string; // FK to users.id
  role: 'member' | 'moderator' | 'admin';
  joined_at: Date;
  UNIQUE: ['hub_id', 'user_id'];
}

// ============================================================================
// CHAT SCHEMA
// ============================================================================

export interface ChatChannelTable {
  id: string; // UUID
  name: string;
  type: 'live' | 'hub' | 'direct';
  live_stream_id?: string; // FK to live_streams.id (if type='live')
  hub_id?: string; // FK to community_hubs.id (if type='hub')
  participant_count: number; // default 0
  last_message_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessageTable {
  id: string; // UUID
  channel_id: string; // FK to chat_channels.id
  user_id: string; // FK to users.id
  text: string;
  reply_to_message_id?: string; // FK to chat_messages.id
  created_at: Date;
  updated_at: Date;
}

export interface ChatChannelMemberTable {
  id: string; // UUID
  channel_id: string; // FK to chat_channels.id
  user_id: string; // FK to users.id
  joined_at: Date;
  last_read_at?: Date;
  UNIQUE: ['channel_id', 'user_id'];
}

// ============================================================================
// NOTIFICATION SCHEMA
// ============================================================================

export interface NotificationTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  type: 'system' | 'social' | 'game' | 'payment';
  title: string;
  body?: string;
  action_url?: string;
  metadata?: Record<string, unknown>; // JSONB
  read: boolean; // default false
  created_at: Date;
  updated_at: Date;
}

export interface NotificationDeviceTokenTable {
  id: string; // UUID
  user_id: string; // FK to users.id
  device_token: string; // UNIQUE
  platform: 'ios' | 'android' | 'web';
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// SEO INDEXER SCHEMA
// ============================================================================

export interface SitemapCacheTable {
  id: string; // UUID
  sitemap_type: 'games' | 'creators' | 'landing-pages' | 'index';
  locale: string;
  content: string; // XML content
  last_generated_at: Date;
  expires_at: Date;
}

export interface SEOKeywordClusterTable {
  id: string; // UUID
  locale: string;
  category: string;
  keywords: string[]; // Array of keywords
  created_at: Date;
  updated_at: Date;
}


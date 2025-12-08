# PHASE 1 – FIGMA & REQUIREMENTS ANALYSIS BLUEPRINTS

## Executive Summary

Based on analysis of:
- SVG Homepage design (1440x8243px, dark theme #080427)
- PDF Pitch document structure
- Master System Prompt requirements
- Existing codebase structure

This document provides the complete blueprints for Strike Gaming Cloud implementation.

---

## 1. ROUTING BLUEPRINT

### 1.1 Web Routes (Next.js 15 App Router)

All routes support i18n with `[locale]` segment. Default locale: `en`.

#### Public Routes

| Route Pattern | Component | Description | Auth Required | SEO Priority |
|--------------|-----------|-------------|---------------|--------------|
| `/` or `/[locale]` | `HomePage` | Marketing homepage + entry feed preview | No | Critical |
| `/[locale]/feed` | `FeedPage` | For You, Following, Explore tabs (Reels & live) | No* | High |
| `/[locale]/games` | `GamesPage` | Game catalog, filters, search, categories | No | Critical |
| `/[locale]/games/[slug]` | `GameDetailPage` | Game detail + Play button + clips gallery | No | Critical |
| `/[locale]/play` | `PlayPage` | Cloud gaming UI (stream player, overlay, Save Replay) | Yes | Medium |
| `/[locale]/clips` | `ClipsPage` | Clip browser (filters by game, creator, language) | No | High |
| `/[locale]/clips/[id]` | `ClipDetailPage` | Individual clip/reel view | No | High |
| `/[locale]/live` | `LivePage` | Live streams directory | No | High |
| `/[locale]/live/[id]` | `LiveViewerPage` | Live stream viewer with chat | No | Medium |
| `/[locale]/creator/[handle]` | `CreatorProfilePage` | Creator profile, stats, clips, lives | No | High |
| `/[locale]/pricing` | `PricingPage` | Plans and subscriptions | No | Critical |
| `/[locale]/wallet` | `WalletPage` | Balance, transactions, payment methods | Yes | Low |
| `/[locale]/auth/login` | `LoginPage` | Login form | No | Medium |
| `/[locale]/auth/register` | `RegisterPage` | Registration form | No | Medium |
| `/[locale]/auth/reset` | `ResetPasswordPage` | Password reset flow | No | Low |
| `/[locale]/account` | `AccountPage` | Settings (language, region, privacy) | Yes | Low |
| `/[locale]/community` | `CommunityPage` | Hubs, channels, events | No* | Medium |
| `/[locale]/legal/terms` | `TermsPage` | Terms of Service | No | Low |
| `/[locale]/legal/privacy` | `PrivacyPage` | Privacy Policy | No | Low |
| `/[locale]/legal/cookies` | `CookiesPage` | Cookie Policy | No | Low |
| `/[locale]/lp/[campaign]/[slug]` | `LandingPageTemplate` | SEM landing pages (dynamic) | No | High |

*Feed and Community show limited content for unauthenticated users.

#### Dynamic Routes Details

**`/[locale]/games/[slug]`**
- Params: `slug` (game identifier, e.g., "gta-vi", "cyberpunk-2077")
- Query params: `?ref=...` (referral tracking)
- State: Game data, clips, related games, user's play history
- Error cases: Game not found (404), Game unavailable in region (403), Server error (500)

**`/[locale]/play`**
- Query params: `?gameId=...&sessionId=...` (optional, can be set via state)
- State: Active session, stream URL, control channel, replay buffer status
- Error cases: No game selected, Session creation failed, VM allocation failed, Network error

**`/[locale]/creator/[handle]`**
- Params: `handle` (creator username/handle)
- State: Creator profile, clips list, live status, follower count, stats
- Error cases: Creator not found (404), Profile private (403)

**`/[locale]/clips/[id]`**
- Params: `id` (clip/reel ID)
- State: Clip data, video URL, creator info, engagement stats, comments
- Error cases: Clip not found (404), Clip removed/private (403)

**`/[locale]/lp/[campaign]/[slug]`**
- Params: `campaign` (campaign identifier), `slug` (page identifier)
- State: Dynamic content from CMS/campaign config
- Error cases: Campaign not found (404), Campaign expired (410)

### 1.2 Mobile Routes (React Native + Expo)

Navigation structure: Tab bar + Stack navigation.

#### Tab Navigation (Bottom Tab Bar)

| Tab | Route | Component | Icon |
|-----|-------|-----------|------|
| Feed | `/feed` | `FeedTab` | Home/Grid |
| Live | `/live` | `LiveTab` | Broadcast |
| Games | `/games` | `GamesTab` | Gamepad |
| Community | `/community` | `CommunityTab` | Users |
| Profile | `/profile` | `ProfileTab` | User |

#### Stack Navigation (Nested)

**Feed Stack:**
- `/feed` → `FeedScreen` (For You, Following, Explore tabs)
- `/feed/reel/[id]` → `ReelDetailScreen` (Full-screen vertical video)
- `/feed/creator/[handle]` → `CreatorProfileScreen`

**Games Stack:**
- `/games` → `GamesScreen` (Catalog)
- `/games/[slug]` → `GameDetailScreen`
- `/games/[slug]/play` → `PlayScreen` (Cloud gaming overlay)

**Live Stack:**
- `/live` → `LiveDirectoryScreen`
- `/live/[id]` → `LiveViewerScreen` (Full-screen with chat)

**Community Stack:**
- `/community` → `CommunityScreen`
- `/community/hub/[id]` → `HubDetailScreen`
- `/community/channel/[id]` → `ChannelScreen`

**Profile Stack:**
- `/profile` → `ProfileScreen`
- `/profile/settings` → `SettingsScreen`
- `/profile/wallet` → `WalletScreen`
- `/profile/clips` → `MyClipsScreen`
- `/profile/edit` → `EditProfileScreen`

### 1.3 Route State Requirements

#### Authentication State
- `isAuthenticated: boolean`
- `user: User | null`
- `session: Session | null` (active gaming session)

#### Feed State
- `feedType: 'for-you' | 'following' | 'explore'`
- `clips: Clip[]`
- `pageToken: string | null` (pagination)
- `loading: boolean`
- `error: Error | null`

#### Game State
- `selectedGame: Game | null`
- `gameClips: Clip[]`
- `relatedGames: Game[]`
- `playHistory: PlaySession[]`

#### Play State
- `activeSession: GamingSession | null`
- `streamUrl: string | null`
- `connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'`
- `replayBufferStatus: 'ready' | 'saving' | 'saved' | 'error'`

---

## 2. COMPONENT BLUEPRINT

### 2.1 Layout Components

#### `Header` (Web)
- **Location**: `apps/web/components/layout/Header.tsx`
- **Props**: None (uses i18n hooks)
- **State**: None (client component)
- **Features**:
  - Logo/Brand link to home
  - Navigation links (Feed, Games, Live, Clips, Community)
  - Auth buttons (Sign In / Sign Up) or User menu (when authenticated)
  - Language switcher (dropdown)
  - Mobile hamburger menu
- **Backend calls**: None (static navigation)
- **Edge cases**: RTL layout for Arabic, mobile responsive collapse

#### `Footer` (Web)
- **Location**: `apps/web/components/layout/Footer.tsx`
- **Props**: None
- **State**: None
- **Features**:
  - Product links
  - Company links (About, Careers, Blog)
  - Support links
  - Legal links (Terms, Privacy, Cookies)
  - Copyright notice
  - Social media links (TODO: confirm social platforms)
- **Backend calls**: None

#### `MobileTabBar` (Mobile)
- **Location**: `apps/mobile/components/navigation/TabBar.tsx`
- **Props**: `currentRoute: string`
- **State**: Active tab index
- **Features**:
  - 5 tabs with icons
  - Badge indicators (notifications, live viewers count)
  - Smooth transitions
- **Backend calls**: None

### 2.2 Page Components

#### `HomePage`
- **Location**: `apps/web/app/[locale]/page.tsx`
- **Sections**:
  1. `Hero` - Main CTA, tagline, "Play Now" button
  2. `Features` - Cloud Gaming, Reels, Social (3 cards)
  3. `FeaturedGames` - Carousel of popular games (TODO: confirm from design)
  4. `FeaturedClips` - Grid of trending clips/reels
  5. `SocialProof` - Testimonials, stats (TODO: confirm from design)
  6. `CTA` - Final call-to-action section
- **Backend calls**:
  - `GET /api/games/v1?featured=true&limit=6` (featured games)
  - `GET /api/clips/v1?trending=true&limit=12` (trending clips)
- **State**: `featuredGames: Game[]`, `trendingClips: Clip[]`, `loading: boolean`
- **Error cases**: API failures (show fallback UI), Empty states

#### `FeedPage`
- **Location**: `apps/web/app/[locale]/feed/page.tsx`
- **Tabs**: For You, Following, Explore
- **Components**:
  - `FeedTabs` - Tab switcher
  - `ReelsGrid` - Infinite scroll grid of vertical videos
  - `ReelCard` - Individual reel preview with thumbnail, creator, stats
- **Backend calls**:
  - `GET /api/feed/v1/for-you?userId=...&locale=...&pageToken=...`
  - `GET /api/feed/v1/following?userId=...&pageToken=...`
  - `GET /api/feed/v1/explore?locale=...&pageToken=...`
- **State**: `activeTab: string`, `clips: Clip[]`, `pageToken: string | null`, `loading: boolean`, `hasMore: boolean`
- **Error cases**: No clips available, Network error, Rate limit exceeded

#### `GamesPage`
- **Location**: `apps/web/app/[locale]/games/page.tsx`
- **Components**:
  - `GameSearchBar` - Search input with autocomplete
  - `GameFilters` - Category, genre, rating, availability filters
  - `GamesGrid` - Responsive grid of game cards
  - `GameCard` - Game thumbnail, title, rating, play button
- **Backend calls**:
  - `GET /api/games/v1?locale=...&category=...&genre=...&search=...&page=...`
- **State**: `games: Game[]`, `filters: GameFilters`, `searchQuery: string`, `page: number`, `total: number`
- **Error cases**: No games found, Filter combination invalid, Search timeout

#### `GameDetailPage`
- **Location**: `apps/web/app/[locale]/games/[slug]/page.tsx`
- **Sections**:
  1. Hero - Game banner, title, rating, Play button
  2. Description - Game description, features, requirements
  3. Clips Gallery - Related clips/reels
  4. Related Games - Similar games carousel
- **Backend calls**:
  - `GET /api/games/v1/[slug]`
  - `GET /api/clips/v1?gameId=...&limit=12`
  - `GET /api/games/v1?relatedTo=...&limit=6`
- **State**: `game: Game | null`, `clips: Clip[]`, `relatedGames: Game[]`, `loading: boolean`
- **Error cases**: Game not found (404), Game unavailable in region (403), Related data fetch failed

#### `PlayPage`
- **Location**: `apps/web/app/[locale]/play/page.tsx`
- **Components**:
  - `StreamPlayer` - WebRTC/HLS video player
  - `GameOverlay` - Controls overlay (Pause, Save Replay, Settings, Exit)
  - `ConnectionIndicator` - Network quality indicator
  - `ReplaySaveToast` - Toast notification when replay is saved
- **Backend calls**:
  - `POST /api/session/v1` (create session)
  - `POST /api/replay/v1/save` (save replay)
  - `POST /api/session/v1/:id/end` (end session)
  - WebSocket: Control channel for input
- **State**: `session: GamingSession | null`, `streamUrl: string | null`, `connectionQuality: string`, `replayStatus: ReplayStatus`, `isPaused: boolean`
- **Error cases**: Session creation failed, VM allocation timeout, Stream connection lost, Replay save failed

#### `ClipsPage`
- **Location**: `apps/web/app/[locale]/clips/page.tsx`
- **Components**:
  - `ClipFilters` - Filter by game, creator, language, date
  - `ClipsGrid` - Grid layout with infinite scroll
  - `ClipCard` - Thumbnail, title, creator, views, duration
- **Backend calls**:
  - `GET /api/clips/v1?gameId=...&creatorId=...&language=...&pageToken=...`
- **State**: `clips: Clip[]`, `filters: ClipFilters`, `pageToken: string | null`, `loading: boolean`
- **Error cases**: No clips found, Invalid filter combination

#### `ClipDetailPage`
- **Location**: `apps/web/app/[locale]/clips/[id]/page.tsx`
- **Components**:
  - `VideoPlayer` - HLS/MP4 video player
  - `ClipInfo` - Title, description, creator, stats (views, likes, shares)
  - `Comments` - Comments section with pagination
  - `RelatedClips` - Similar clips carousel
- **Backend calls**:
  - `GET /api/clips/v1/[id]`
  - `GET /api/clips/v1/[id]/comments?page=...`
  - `POST /api/clips/v1/[id]/like` (if authenticated)
  - `POST /api/clips/v1/[id]/share`
  - `GET /api/clips/v1?relatedTo=...&limit=6`
- **State**: `clip: Clip | null`, `comments: Comment[]`, `relatedClips: Clip[]`, `isLiked: boolean`, `loading: boolean`
- **Error cases**: Clip not found (404), Clip removed/private (403), Comments load failed

#### `LivePage`
- **Location**: `apps/web/app/[locale]/live/page.tsx`
- **Components**:
  - `LiveStreamsGrid` - Grid of active live streams
  - `LiveStreamCard` - Thumbnail, viewer count, creator, game, title
  - `LiveFilters` - Filter by game, category
- **Backend calls**:
  - `GET /api/live/v1/streams?gameId=...&category=...`
- **State**: `streams: LiveStream[]`, `filters: LiveFilters`, `loading: boolean`
- **Error cases**: No streams available, API error

#### `LiveViewerPage`
- **Location**: `apps/web/app/[locale]/live/[id]/page.tsx`
- **Components**:
  - `LivePlayer` - HLS live stream player
  - `LiveChat` - Real-time chat sidebar
  - `StreamInfo` - Creator, game, viewer count, title
  - `FollowButton` - Follow creator button
- **Backend calls**:
  - `GET /api/live/v1/streams/[id]`
  - WebSocket: Chat messages, viewer count updates
  - `POST /api/creators/v1/[handle]/follow` (if authenticated)
- **State**: `stream: LiveStream | null`, `chatMessages: ChatMessage[]`, `viewerCount: number`, `isFollowing: boolean`, `loading: boolean`
- **Error cases**: Stream ended, Stream not found (404), Chat connection failed

#### `CreatorProfilePage`
- **Location**: `apps/web/app/[locale]/creator/[handle]/page.tsx`
- **Sections**:
  1. Profile Header - Avatar, handle, bio, stats (followers, clips, views)
  2. Tabs - Clips, Lives, About
  3. Clips Grid - Creator's clips/reels
  4. Live Status - Current live stream if active
- **Backend calls**:
  - `GET /api/creators/v1/[handle]`
  - `GET /api/clips/v1?creatorId=...&limit=...`
  - `GET /api/live/v1/streams?creatorId=...`
  - `POST /api/creators/v1/[handle]/follow` (if authenticated)
- **State**: `creator: Creator | null`, `clips: Clip[]`, `liveStream: LiveStream | null`, `isFollowing: boolean`, `loading: boolean`
- **Error cases**: Creator not found (404), Profile private (403), Clips load failed

#### `PricingPage`
- **Location**: `apps/web/app/[locale]/pricing/page.tsx`
- **Components**:
  - `PricingPlans` - Grid of subscription plans
  - `PlanCard` - Plan name, price, features, CTA button
  - `FAQ` - Frequently asked questions
- **Backend calls**:
  - `GET /api/pricing/v1/plans?locale=...&currency=...`
- **State**: `plans: Plan[]`, `selectedCurrency: string`, `loading: boolean`
- **Error cases**: Plans not available, Currency conversion failed

#### `WalletPage`
- **Location**: `apps/web/app/[locale]/wallet/page.tsx`
- **Components**:
  - `BalanceCard` - Current balance display
  - `TransactionHistory` - List of transactions
  - `PaymentMethods` - Saved payment methods
  - `AddFundsButton` - Add funds CTA
- **Backend calls**:
  - `GET /api/wallet/v1/balance`
  - `GET /api/wallet/v1/transactions?page=...`
  - `GET /api/payments/v1/methods`
- **State**: `balance: number`, `transactions: Transaction[]`, `paymentMethods: PaymentMethod[]`, `loading: boolean`
- **Error cases**: Wallet not found, Transactions load failed, Payment methods load failed

#### `LoginPage` / `RegisterPage`
- **Location**: `apps/web/app/[locale]/auth/login/page.tsx`, `apps/web/app/[locale]/auth/register/page.tsx`
- **Components**:
  - `AuthForm` - Email/password form
  - `SocialAuth` - OAuth buttons (TODO: confirm providers - Google, Apple, etc.)
  - `ForgotPasswordLink` - Link to reset password
- **Backend calls**:
  - `POST /api/auth/v1/login`
  - `POST /api/auth/v1/register`
- **State**: `email: string`, `password: string`, `loading: boolean`, `error: string | null`
- **Error cases**: Invalid credentials, Email already exists, Rate limit exceeded, Network error

#### `AccountPage`
- **Location**: `apps/web/app/[locale]/account/page.tsx`
- **Sections**:
  - Profile Settings - Avatar, display name, bio
  - Language & Region - Language selector, timezone, region
  - Privacy - Privacy settings, data export, account deletion
  - Notifications - Notification preferences
- **Backend calls**:
  - `GET /api/user/v1/me`
  - `PATCH /api/user/v1/me`
  - `GET /api/user/v1/preferences`
  - `PATCH /api/user/v1/preferences`
- **State**: `user: User`, `preferences: UserPreferences`, `loading: boolean`, `saving: boolean`
- **Error cases**: User not found, Update failed, Validation errors

### 2.3 UI Primitive Components (shadcn/ui pattern)

#### `Button`
- **Location**: `apps/web/components/ui/button.tsx` ✅ (exists)
- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`

#### `Input`
- **Location**: `apps/web/components/ui/input.tsx` (TODO: create)
- **Props**: `type`, `placeholder`, `value`, `onChange`, `error`, `disabled`
- **Variants**: `default`, `error`, `disabled`

#### `Card`
- **Location**: `apps/web/components/ui/card.tsx` (TODO: create)
- **Sub-components**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

#### `Dialog` / `Modal`
- **Location**: `apps/web/components/ui/dialog.tsx` (TODO: create)
- **Use cases**: Confirmations, forms, video player overlays

#### `Tabs`
- **Location**: `apps/web/components/ui/tabs.tsx` (TODO: create)
- **Use cases**: Feed tabs, Creator profile tabs, Settings tabs

#### `Select` / `Dropdown`
- **Location**: `apps/web/components/ui/select.tsx` (TODO: create)
- **Use cases**: Language switcher, filters, sorting

#### `VideoPlayer`
- **Location**: `apps/web/components/media/VideoPlayer.tsx` (TODO: create)
- **Props**: `src`, `type` ('hls' | 'mp4' | 'webrtc'), `autoplay`, `controls`, `onEnded`
- **Features**: HLS.js for HLS, Video.js or custom for WebRTC, MP4 native

#### `ReelCard`
- **Location**: `apps/web/components/feed/ReelCard.tsx` (TODO: create)
- **Props**: `clip: Clip`, `onClick`, `lazyLoad`
- **Features**: Thumbnail, creator avatar, stats overlay, hover effects

#### `GameCard`
- **Location**: `apps/web/components/games/GameCard.tsx` (TODO: create)
- **Props**: `game: Game`, `onPlay`, `onClick`
- **Features**: Game thumbnail, title, rating, play button overlay

#### `StreamPlayer`
- **Location**: `apps/web/components/gaming/StreamPlayer.tsx` (TODO: create)
- **Props**: `streamUrl: string`, `sessionId: string`, `onReplaySave`, `onConnectionChange`
- **Features**: WebRTC/HLS player, overlay controls, connection quality indicator

### 2.4 Mobile-Specific Components

#### `ReelsFeed` (Mobile)
- **Location**: `apps/mobile/components/feed/ReelsFeed.tsx` (TODO: create)
- **Props**: `clips: Clip[]`, `onSwipe`, `onLike`, `onShare`
- **Features**: Vertical swipe, preload next/previous, 60 FPS optimization

#### `LiveChat` (Mobile)
- **Location**: `apps/mobile/components/live/LiveChat.tsx` (TODO: create)
- **Props**: `streamId: string`, `messages: ChatMessage[]`
- **Features**: Real-time messages, emoji picker, message input

---

## 3. DATAFLOW BLUEPRINT

### 3.1 API Endpoints Mapping

#### Authentication Flow

```
User Action: Click "Sign Up"
  → Frontend: POST /api/auth/v1/register
    Body: { email, password, locale, marketingConsent }
  → Backend: auth-service
    → Validate input
    → Create user (user-service)
    → Generate JWT token
    → Return: { data: { userId, token, refreshToken } }
  → Frontend: Store token, redirect to onboarding or feed
  → Events: UserRegistered → analytics-service
```

```
User Action: Click "Sign In"
  → Frontend: POST /api/auth/v1/login
    Body: { email, password }
  → Backend: auth-service
    → Validate credentials
    → Generate JWT token
    → Return: { data: { userId, token, refreshToken } }
  → Frontend: Store token, redirect to feed or last page
  → Events: UserLoggedIn → analytics-service
```

#### Game Discovery Flow

```
User Action: Visit /games
  → Frontend: GET /api/games/v1?locale=en&page=1
  → Backend: gateway-service → game-service
    → Query games from database
    → Apply filters, pagination
    → Return: { data: { games: Game[], total: number, page: number } }
  → Frontend: Render GamesGrid
  → Cache: Edge cache (TTL: 60s) for public catalog
```

```
User Action: Click game card
  → Frontend: Navigate to /games/[slug]
  → Frontend: GET /api/games/v1/[slug]
  → Backend: gateway-service → game-service
    → Fetch game details
    → Return: { data: { game: Game } }
  → Frontend: GET /api/clips/v1?gameId=...&limit=12
  → Backend: gateway-service → clip-service
    → Fetch related clips
    → Return: { data: { clips: Clip[] } }
  → Frontend: Render GameDetailPage
  → SEO: Generate schema.org VideoGame JSON-LD
```

#### Cloud Gaming Session Flow

```
User Action: Click "Play" on game
  → Frontend: POST /api/session/v1
    Body: { userId, gameId, region, deviceInfo }
    Headers: { Authorization: Bearer <token>, Idempotency-Key: <uuid> }
  → Backend: gateway-service → session-service
    → Validate user, game, region
    → Check geo rules (RU payments blocked, etc.)
    → Call orchestrator-service: CreateVM or AssignSessionToVM
      → orchestrator-service: Select VM template based on game
      → Provision VM if needed (TEMPLATE → PROVISIONING → BOOTING → READY)
      → Assign session to VM
      → Configure streaming encoder (NVENC params from game settings)
    → Return: { data: { sessionId, streamUrl, controlChannelUrl } }
  → Frontend: Initialize StreamPlayer with streamUrl
  → Frontend: Connect WebSocket to controlChannelUrl
  → Events: SessionStarted → analytics-service, notification-service
```

```
User Action: Press "Save Replay" button
  → Frontend: POST /api/replay/v1/save
    Body: { sessionId, userId, gameId, fromSeconds?, toSeconds? }
    Headers: { Idempotency-Key: <uuid> }
  → Backend: gateway-service → replay-engine-service
    → Extract 90-120s circular buffer from VM
    → Encode to MP4 (NVENC, H.264/HEVC)
    → Upload to object storage: replays/.../replayId.mp4
    → Return: 202 Accepted
    → Emit: ReplayCreated { replayId, storageUrl, sessionId, userId }
  → Frontend: Show toast "Replay saving..."
  → clip-service: Listens to ReplayCreated
    → Create Clip record with status: PENDING_EDIT
  → Frontend: Show notification "Your Replay is ready in Reels" (when ready)
```

#### Reel Creation Flow

```
User Action: Edit replay → Add text, stickers, music
  → Frontend: User interacts with editing UI (client-side only)
  → Frontend: Generate edit instructions JSON
  → Frontend: POST /api/editing/v1/render
    Body: { replayId, instructions: { trim, texts[], stickers[], filters[], audioLayers[] } }
  → Backend: gateway-service → video-editing-service
    → Download replay from storage
    → Apply trimming
    → Apply filters and overlays (FFmpeg/GStreamer)
    → Mix audio (ducking rules)
    → Encode final output (1080x1920, H.264/HEVC)
    → Generate thumbnail
    → Upload to reels/.../reelId.mp4
    → Return: 202 Accepted
    → Emit: RenderCompleted { reelId, videoUrl, thumbnailUrl, replayId }
  → clip-service: Listens to RenderCompleted
    → Update Clip status: PUBLISHED
    → Link Reel to Clip
  → feed-service: Listens to RenderCompleted
    → Index new Reel for recommendation
  → Frontend: Show notification "Your Reel is published!"
  → Events: ReelPublished → analytics-service
```

#### Feed Recommendation Flow

```
User Action: Visit /feed (For You tab)
  → Frontend: GET /api/feed/v1/for-you?userId=...&locale=...&pageToken=...
  → Backend: gateway-service → feed-service
    → Call recommendation-engine logic
      → Gather signals: watchTimeRatio, completion, likes, shares, followedCreator, sameGamePreferenceScore, freshness, localeMatch, sessionContext, premiumUserBoost, creatorQualityScore
      → Apply scoring formula (w1-w14 weights)
      → Apply diversity penalty, repetition penalty
      → Sort by score
      → Return top N clips
    → Return: { data: { clips: Clip[], pageToken: string } }
  → Frontend: Render ReelsGrid
  → Frontend: Track impressions (POST /api/analytics/v1/events)
```

```
User Action: Watch clip (50% completion)
  → Frontend: POST /api/analytics/v1/events
    Body: { type: 'ClipViewed', clipId, userId, watchTimeRatio: 0.5, completed: false }
  → Backend: analytics-service
    → Store event
    → Update user's watch history
    → Update clip's engagement metrics
    → Emit: ClipEngagementUpdated → feed-service (for recommendation recalculation)
```

#### Payment Flow

```
User Action: Click "Subscribe" on pricing page
  → Frontend: POST /api/payments/v1/checkout-session
    Body: { userId, planId, locale, currency, country }
  → Backend: gateway-service → payments-service
    → Validate geo rules (block RU payments, handle CN)
    → Create Stripe checkout session
    → Return: { data: { checkoutUrl: string } }
  → Frontend: Redirect to Stripe checkout
  → Stripe: User completes payment
  → Stripe: Webhook → POST /api/payments/v1/webhook/stripe
  → Backend: payments-service
    → Verify webhook signature
    → Process payment event
    → Emit: PaymentCompleted { userId, planId, amount, currency }
  → wallet-service: Listens to PaymentCompleted
    → Credit user's wallet if needed
  → user-service: Listens to PaymentCompleted
    → Update user's subscription status
  → Frontend: Redirect to success page
  → Events: SubscriptionStarted → analytics-service
```

### 3.2 Event Bus Topics & Events

#### Topic: `sessions`
- **SessionStarted**: `{ sessionId, userId, gameId, vmId, region, timestamp }`
- **SessionEnded**: `{ sessionId, userId, gameId, duration, timestamp }`
- **SessionError**: `{ sessionId, userId, errorCode, errorMessage, timestamp }`

#### Topic: `replays`
- **ReplayCreated**: `{ replayId, storageUrl, sessionId, userId, gameId, timestamp }`
- **ReplayFailed**: `{ replayId, sessionId, errorCode, errorMessage, timestamp }`

#### Topic: `renders`
- **RenderRequested**: `{ renderId, replayId, userId, timestamp }`
- **RenderCompleted**: `{ renderId, reelId, videoUrl, thumbnailUrl, replayId, userId, timestamp }`
- **RenderFailed**: `{ renderId, replayId, errorCode, errorMessage, timestamp }`

#### Topic: `payments`
- **PaymentCompleted**: `{ paymentId, userId, planId, amount, currency, timestamp }`
- **PaymentFailed**: `{ paymentId, userId, planId, errorCode, timestamp }`

#### Topic: `analytics-events`
- **PageViewed**: `{ userId?, page, locale, timestamp }`
- **ClipViewed**: `{ userId?, clipId, watchTimeRatio, completed, timestamp }`
- **ReplaySaved**: `{ userId, sessionId, gameId, timestamp }`
- **ReelPublished**: `{ userId, reelId, clipId, timestamp }`
- **SubscriptionStarted**: `{ userId, planId, timestamp }`
- **UserRegistered**: `{ userId, locale, timestamp }`
- **UserLoggedIn**: `{ userId, timestamp }`

#### Topic: `moderation`
- **ContentFlagged**: `{ contentId, contentType, reason, score, timestamp }`
- **UserBanned**: `{ userId, reason, duration, timestamp }`
- **ContentRemoved**: `{ contentId, contentType, reason, timestamp }`

#### Topic: `vm-lifecycle`
- **VMProvisioned**: `{ vmId, templateId, region, timestamp }`
- **VMReady**: `{ vmId, timestamp }`
- **VMError**: `{ vmId, errorCode, errorMessage, timestamp }`
- **VMPoolLowCapacity**: `{ region, availableVMs, timestamp }`
- **VMTerminated**: `{ vmId, reason, timestamp }`

### 3.3 State Management Requirements

#### Frontend State (Web - React Context / Zustand)
- **AuthState**: `{ user: User | null, token: string | null, isAuthenticated: boolean }`
- **FeedState**: `{ clips: Clip[], pageToken: string | null, loading: boolean, error: Error | null }`
- **GameState**: `{ selectedGame: Game | null, games: Game[], filters: GameFilters }`
- **SessionState**: `{ activeSession: GamingSession | null, streamUrl: string | null, connectionQuality: string }`
- **UIState**: `{ theme: 'light' | 'dark', language: string, sidebarOpen: boolean }`

#### Frontend State (Mobile - React Context / Redux)
- **AuthState**: Same as web
- **FeedState**: Same as web + `currentReelIndex: number`
- **NavigationState**: `{ currentTab: string, stackHistory: Route[] }`
- **PlayerState**: `{ isPlaying: boolean, currentTime: number, volume: number }`

#### Backend State (Per Service)
- **session-service**: Active sessions map `{ sessionId: Session }`
- **orchestrator-service**: VM pool state `{ vmId: VMState }`
- **feed-service**: User recommendation cache `{ userId: CachedRecommendations }`
- **clip-service**: Clip index for search `{ clipId: ClipIndex }`

### 3.4 Error Handling & Edge Cases

#### Network Errors
- **Retry Strategy**: Exponential backoff (3 attempts max)
- **Fallback UI**: Show cached data if available, error message otherwise
- **User Feedback**: Toast notifications for transient errors

#### Authentication Errors
- **401 Unauthorized**: Redirect to login, preserve intended destination
- **403 Forbidden**: Show error message, suggest upgrade if subscription-related
- **Token Expired**: Auto-refresh token, retry request

#### Session Errors
- **VM Allocation Failed**: Show "Game temporarily unavailable, try again later"
- **Stream Connection Lost**: Auto-reconnect (3 attempts), then show error
- **Replay Save Failed**: Show error, allow retry

#### Payment Errors
- **Geo Blocked (RU)**: Show "Payments not available in your region"
- **Payment Failed**: Show error, allow retry with different payment method
- **Webhook Failure**: Log for manual review, retry queue

#### Content Errors
- **Clip Not Found (404)**: Show "This clip has been removed"
- **Clip Private (403)**: Show "This clip is private"
- **Creator Not Found (404)**: Show "Creator not found"
- **Game Unavailable in Region (403)**: Show "Game not available in your region"

---

## 4. MISSING INFORMATION & TODOs

### 4.1 Design Clarifications Needed

- [ ] **TODO**: Confirm social media platforms for footer links (Twitter, Instagram, Discord, etc.)
- [ ] **TODO**: Confirm OAuth providers for social login (Google, Apple, Facebook, etc.)
- [ ] **TODO**: Confirm exact homepage sections from SVG (FeaturedGames, SocialProof sections need verification)
- [ ] **TODO**: Confirm mobile app color scheme and branding (should match web)
- [ ] **TODO**: Confirm notification preferences UI/UX
- [ ] **TODO**: Confirm community features scope (Hubs, Channels, Events - need detailed specs)

### 4.2 Business Logic Clarifications

- [ ] **TODO**: Confirm subscription plan tiers and pricing (from PDF pitch)
- [ ] **TODO**: Confirm free tier limitations (play time, game access, etc.)
- [ ] **TODO**: Confirm referral/invite system rewards
- [ ] **TODO**: Confirm creator monetization model (if any)
- [ ] **TODO**: Confirm moderation escalation rules (auto vs manual review thresholds)

### 4.3 Technical Clarifications

- [ ] **TODO**: Confirm CDN provider (Cloudflare, AWS CloudFront, etc.)
- [ ] **TODO**: Confirm object storage provider (AWS S3, Google Cloud Storage, etc.)
- [ ] **TODO**: Confirm message bus choice (Kafka vs NATS)
- [ ] **TODO**: Confirm database hosting (managed Postgres vs self-hosted)
- [ ] **TODO**: Confirm monitoring/observability stack details (Prometheus, Grafana versions, etc.)
- [ ] **TODO**: Confirm CI/CD platform (GitHub Actions, GitLab CI, etc.)

### 4.4 Content & Localization

- [ ] **TODO**: Confirm all 17 language translations are available (currently only EN, IT have messages)
- [ ] **TODO**: Confirm RTL layout requirements for Arabic (partial implementation exists)
- [ ] **TODO**: Confirm date/time formatting per locale
- [ ] **TODO**: Confirm currency formatting per locale

### 4.5 Security & Compliance

- [ ] **TODO**: Confirm GDPR compliance requirements (data export, deletion, consent management)
- [ ] **TODO**: Confirm age verification requirements (COPPA, etc.)
- [ ] **TODO**: Confirm content rating system (ESRB, PEGI, etc.)
- [ ] **TODO**: Confirm data retention policies

---

## 5. COMPONENT INVENTORY

### 5.1 Existing Components (✅)

- `Header` - Web navigation header
- `Footer` - Web footer with links
- `Hero` - Homepage hero section
- `Features` - Homepage features section
- `Button` - UI button component

### 5.2 Components to Create (⏳)

#### Layout
- `MobileTabBar` - Mobile bottom navigation
- `Sidebar` - Web sidebar (if needed)
- `Breadcrumbs` - Navigation breadcrumbs

#### Pages
- `FeedPage`, `GamesPage`, `GameDetailPage`, `PlayPage`, `ClipsPage`, `ClipDetailPage`
- `LivePage`, `LiveViewerPage`, `CreatorProfilePage`, `PricingPage`, `WalletPage`
- `LoginPage`, `RegisterPage`, `ResetPasswordPage`, `AccountPage`, `CommunityPage`
- `LandingPageTemplate` - SEM landing pages

#### UI Primitives
- `Input`, `Card`, `Dialog`, `Tabs`, `Select`, `Dropdown`, `Toast`, `Skeleton`
- `Avatar`, `Badge`, `Tooltip`, `Popover`, `Alert`

#### Media
- `VideoPlayer`, `StreamPlayer`, `ReelCard`, `GameCard`, `ClipCard`
- `Image` - Optimized image component

#### Gaming
- `GameOverlay`, `ConnectionIndicator`, `ReplaySaveButton`, `ControlPanel`

#### Feed
- `ReelsGrid`, `ReelCard`, `FeedTabs`, `InfiniteScroll`

#### Forms
- `AuthForm`, `GameSearchBar`, `ClipFilters`, `GameFilters`

#### Mobile-Specific
- `ReelsFeed` - Vertical swipe feed
- `LiveChat` - Mobile chat component
- `BottomSheet` - Mobile bottom sheet modal

---

## 6. USER FLOWS

### 6.1 New User Onboarding Flow

1. User visits homepage `/`
2. Clicks "Sign Up" → `/auth/register`
3. Fills registration form → `POST /api/auth/v1/register`
4. Redirected to onboarding (TODO: confirm onboarding steps)
5. Optional: Select favorite games/genres
6. Redirected to `/feed` (For You tab)

### 6.2 Game Play Flow

1. User browses `/games`
2. Clicks game card → `/games/[slug]`
3. Clicks "Play Now" → `/play?gameId=...`
4. Session created → Stream starts
5. User plays game
6. User presses "Save Replay" → Replay saved
7. User ends session → Redirected to `/feed` or game detail

### 6.3 Reel Creation Flow

1. User has saved replay (from previous flow)
2. User navigates to "My Clips" or notification
3. User clicks "Edit Replay"
4. Editing UI opens (client-side)
5. User adds text, stickers, music
6. User clicks "Publish"
7. Render request sent → Server processes
8. Reel published → Appears in feed

### 6.4 Content Discovery Flow

1. User visits `/feed` (For You tab)
2. Recommendation engine serves personalized clips
3. User watches clips, likes, shares
4. User clicks creator → `/creator/[handle]`
5. User follows creator
6. User clicks game from clip → `/games/[slug]`
7. User plays game (see Game Play Flow)

### 6.5 Payment Flow

1. User visits `/pricing`
2. User selects plan
3. User clicks "Subscribe"
4. Redirected to Stripe checkout
5. User completes payment
6. Webhook processes payment
7. User redirected to success page
8. Subscription activated → User gains access

---

## 7. EDGE CASES & ERROR SCENARIOS

### 7.1 Authentication Edge Cases

- **Email already exists**: Show error, suggest login
- **Weak password**: Show validation error with requirements
- **Rate limit exceeded**: Show "Too many attempts, try again in X minutes"
- **Account locked**: Show "Account temporarily locked, contact support"

### 7.2 Gaming Session Edge Cases

- **No VM available**: Show queue position, estimated wait time
- **VM provisioning timeout**: Retry with different region, show error if all fail
- **Stream disconnection**: Auto-reconnect (3 attempts), show error if fails
- **Game crash on VM**: Auto-restart session, notify user
- **Region not supported**: Show "Game not available in your region"

### 7.3 Replay/Reel Edge Cases

- **Replay buffer empty**: Show "No replay available" (shouldn't happen if buffer is 90-120s)
- **Render timeout**: Show error, allow retry
- **Render failed**: Show error, allow retry with different settings
- **Storage quota exceeded**: Show "Storage full, delete old clips"

### 7.4 Feed Edge Cases

- **No recommendations**: Show popular clips as fallback
- **All clips watched**: Show "You're all caught up!" message
- **Network slow**: Show loading skeleton, implement progressive loading
- **Content age-restricted**: Show age gate, verify user age

### 7.5 Payment Edge Cases

- **Payment declined**: Show error, suggest different payment method
- **Partial payment**: Handle via webhook, notify user
- **Refund processing**: Show refund status, update wallet
- **Currency conversion error**: Show error, allow currency selection

---

## 8. SEO/SEM REQUIREMENTS

### 8.1 Page-Level SEO

Each page must have:
- Unique `<title>` tag
- Meta description
- Open Graph tags (og:title, og:description, og:image, og:url)
- Twitter Card tags
- Canonical URL
- Hreflang tags for all 17 languages

### 8.2 Structured Data (Schema.org)

- **HomePage**: `WebSite` schema
- **GameDetailPage**: `VideoGame` schema
- **ClipDetailPage**: `VideoObject` schema
- **CreatorProfilePage**: `Person` schema
- **LiveViewerPage**: `BroadcastEvent` schema

### 8.3 Sitemaps

- `sitemap.xml` - Index sitemap
- `sitemap-games-<locale>.xml` - Games per locale
- `sitemap-creators-<locale>.xml` - Creators per locale
- `sitemap-lp-<locale>.xml` - Landing pages per locale
- Auto-refresh on content updates

### 8.4 Landing Pages

- Route pattern: `/lp/[locale]/[campaign]/[slug]`
- Dynamic content from CMS/campaign config
- Strong CTAs, social proof, FAQ sections
- A/B testing support (TODO: confirm A/B testing platform)

---

## 9. PERFORMANCE REQUIREMENTS

### 9.1 Web Performance

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Image optimization**: WebP/AVIF, lazy loading, responsive sizes

### 9.2 Mobile Performance

- **Feed scroll**: 60 FPS, no jank
- **Video preload**: Next 2-3 videos in background
- **App launch**: < 2s cold start
- **Navigation**: < 100ms transition

### 9.3 Streaming Performance

- **Stream start latency**: < 2s (WebRTC) or < 5s (HLS)
- **Input latency**: < 50ms (gamepad/keyboard to screen)
- **Connection quality**: Real-time monitoring, adaptive bitrate

---

## 10. ACCESSIBILITY REQUIREMENTS

- **WCAG 2.1 AA compliance**
- **Keyboard navigation**: All interactive elements accessible
- **Screen reader support**: ARIA labels, semantic HTML
- **Color contrast**: Minimum 4.5:1 for text
- **Focus indicators**: Visible focus states
- **Alt text**: All images have descriptive alt text

---

## PHASE 1 COMPLETE

All blueprints have been created:
- ✅ Routing Blueprint (Web + Mobile)
- ✅ Component Blueprint (Layout, Pages, UI Primitives)
- ✅ Dataflow Blueprint (API calls, Events, State Management)

**Next Phase**: PHASE 2 - Web Frontend implementation can begin.

**No code has been written** - Only structured markdown blueprints as required.


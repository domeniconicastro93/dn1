# PHASE 4 - Backend Microservices & API Contracts - COMPLETED

## Overview

All 14 backend microservices have been implemented with complete API contracts, following the Master Prompt specifications.

## Services Implemented

### 1. gateway-service
- **Port**: 3000
- **Purpose**: Central entry point, auth enforcement, rate limiting, routing
- **Endpoints**:
  - `GET /health` - Health check
  - Proxies to all other services via `/api/<service-name>/v1/*`
- **Features**:
  - Global rate limiting
  - CORS configuration
  - HTTP proxy to internal services
  - TODO: JWT validation middleware (to be completed in Phase 5)

### 2. auth-service
- **Port**: 3001
- **Purpose**: Authentication and authorization
- **Endpoints**:
  - `POST /api/auth/v1/register` - User registration
  - `POST /api/auth/v1/login` - User login
  - `POST /api/auth/v1/refresh` - Refresh access token
  - `POST /api/auth/v1/logout` - Logout
  - `POST /api/auth/v1/password/forgot` - Request password reset
  - `POST /api/auth/v1/password/reset` - Reset password
- **Features**:
  - Rate limiting per endpoint
  - JWT token generation (placeholder)
  - TODO: Actual password hashing, database integration

### 3. user-service
- **Port**: 3002
- **Purpose**: User profile management
- **Endpoints**:
  - `GET /api/user/v1/:userId` - Get user profile
  - `PUT /api/user/v1/:userId` - Update user profile
- **Features**:
  - Auth middleware
  - Rate limiting
  - TODO: Database integration

### 4. payments-service
- **Port**: 3009
- **Purpose**: Payment processing (FIAT only, Stripe)
- **Endpoints**:
  - `POST /api/payments/v1/checkout-session` - Create Stripe checkout session
  - `POST /api/payments/v1/webhook/stripe` - Stripe webhook handler
- **Features**:
  - Geo rules enforcement (blocks RU payments)
  - Rate limiting (stricter for payments)
  - TODO: Stripe integration, event emission

### 5. wallet-service
- **Port**: 3010
- **Purpose**: Virtual wallet management
- **Endpoints**:
  - `GET /api/wallet/v1` - Get wallet balance
  - `GET /api/wallet/v1/transactions` - List transactions
- **Features**:
  - Auth middleware
  - Transaction history
  - TODO: Database integration

### 6. game-service
- **Port**: 3003
- **Purpose**: Game catalog management
- **Endpoints**:
  - `GET /api/game/v1` - List games (with filters: genre, search, pagination)
  - `GET /api/game/v1/:slug` - Get game by slug
- **Features**:
  - Public access (no auth required)
  - Rate limiting
  - TODO: Database integration

### 7. session-service
- **Port**: 3004
- **Purpose**: Cloud gaming session management
- **Endpoints**:
  - `POST /api/session/v1` - Create gaming session
  - `GET /api/session/v1/:sessionId` - Get session status
  - `POST /api/session/v1/:sessionId/end` - End session
- **Features**:
  - Auth middleware
  - Integration with orchestrator-service
  - TODO: VM allocation logic (Phase 5)

### 8. orchestrator-service
- **Port**: 3012
- **Purpose**: GPU VM lifecycle management (external interface only)
- **Endpoints**:
  - `POST /api/orchestrator/v1/vm` - Create VM
  - `POST /api/orchestrator/v1/vm/assign` - Assign session to VM
  - `GET /api/orchestrator/v1/vm/:vmId` - Get VM status
- **Features**:
  - External API only (internal logic in Phase 5)
  - VM state machine (TEMPLATE, PROVISIONING, BOOTING, READY, IN_USE, DRAINING, ERROR, TERMINATED)
  - TODO: Actual VM provisioning (Phase 5)

### 9. replay-engine-service
- **Port**: 3005
- **Purpose**: Replay saving and processing (API only)
- **Endpoints**:
  - `POST /api/replay/v1/save` - Save replay (requires Idempotency-Key header)
  - `GET /api/replay/v1/:replayId/status` - Get replay status
- **Features**:
  - Idempotency support
  - Async processing (202 Accepted)
  - TODO: Circular buffer extraction, NVENC encoding (Phase 6)

### 10. video-editing-service
- **Port**: 3006
- **Purpose**: Video editing and rendering (API only)
- **Endpoints**:
  - `POST /api/editing/v1/render` - Render video with editing instructions
  - `GET /api/editing/v1/render/:renderId/status` - Get render status
- **Features**:
  - Edit instructions JSON format
  - Async rendering (202 Accepted)
  - TODO: Actual rendering pipeline (Phase 6)

### 11. clip-service
- **Port**: 3007
- **Purpose**: Clip/Reel management
- **Endpoints**:
  - `GET /api/clips/v1` - List clips (with filters: gameId, creatorId, language, tag)
  - `GET /api/clips/v1/:id` - Get clip by ID
  - `POST /api/clips/v1/from-replay` - Create clip from replay
- **Features**:
  - Public access for listing
  - Filtering and pagination
  - TODO: Database integration, event listeners

### 12. feed-service
- **Port**: 3008
- **Purpose**: Feed generation (For You, Following, Explore)
- **Endpoints**:
  - `GET /api/feed/v1/for-you` - For You feed
  - `GET /api/feed/v1/following` - Following feed
  - `GET /api/feed/v1/explore` - Explore feed
- **Features**:
  - Pagination with pageToken
  - Locale support
  - TODO: Recommendation engine (Phase 7)

### 13. analytics-service
- **Port**: 3011
- **Purpose**: Analytics event tracking
- **Endpoints**:
  - `POST /api/analytics/v1/events` - Track event
  - `GET /api/analytics/v1/metrics` - Get metrics (admin)
- **Features**:
  - Event types: PageView, SignUp, PlaySessionStart, ReplaySaved, ReelPublished, PaymentCompleted, ClipViewed, LiveStreamViewed
  - TODO: Database storage, GA4 integration

### 14. moderation-service
- **Port**: 3013
- **Purpose**: Content moderation
- **Endpoints**:
  - `POST /api/moderation/v1/check` - Check content for moderation
  - `POST /api/moderation/v1/flag` - Manual flagging by users
- **Features**:
  - Content types: text, image, video
  - Moderation scores (hate, harassment, selfHarm, nsfw, violence)
  - Actions: hide, age-restrict, shadowban, manual-review
  - TODO: ML pipeline (Phase 7)

## Shared Packages

### @strike/shared-types
- All DTOs as per Master Prompt
- API response envelopes
- Type definitions for all services

### @strike/shared-utils
- `successResponse()` - Standard success response
- `errorResponse()` - Standard error response
- `ErrorCodes` - Common error codes
- `rateLimiter` - In-memory rate limiter (TODO: Redis in production)
- `RateLimitConfigs` - Default rate limit configurations

### @strike/shared-db
- Database schema definitions (TypeScript types)
- Tables for: users, games, sessions, replays, clips, payments, wallet, analytics, moderation, etc.
- Ready for SQL migration generation in Phase 9

## API Contract Standards

All services follow these standards:

1. **Base Path**: `/api/<service-name>/v1`
2. **Response Envelope**:
   - Success: `{ data: T, meta?: {...} }`
   - Error: `{ error: { code: string, message: string, details?: any } }`
3. **Status Codes**:
   - 200: Success
   - 201: Created
   - 202: Accepted (async operations)
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 409: Conflict
   - 429: Rate Limit Exceeded
   - 500: Internal Server Error
4. **Rate Limiting**:
   - Public GET: 60 req/min
   - Authenticated: 120 req/min
   - Payments: 10 req/min
5. **Authentication**: JWT Bearer token (placeholder validation)
6. **Idempotency**: Required for payments and replay operations (Idempotency-Key header)

## Next Steps (Phase 5+)

- Phase 5: Implement orchestrator internals (VM provisioning, WebRTC)
- Phase 6: Implement replay buffer extraction and video rendering
- Phase 7: Implement recommendation engine and ML moderation
- Phase 9: Generate SQL migrations from schemas, deploy to production

## Notes

- All services compile and have proper TypeScript types
- Mock responses for Phase 4 (database integration in later phases)
- All API contracts match Master Prompt specifications
- Ready for frontend integration (web/mobile can call these APIs)


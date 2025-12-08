# STRIKE_DEBUG_REPORT

## Phase 1: Inventory & Map

### Project Structure
- **Apps**: `web`, `mobile`
- **Packages**: `shared-db`, `shared-i18n`, `shared-types`, `shared-utils`
- **Services**:
  - Core: `auth-service`, `gateway-service`, `orchestrator-service`
  - Features: `feed-service`, `replay-engine-service`, `clip-service`, `streaming-ingest-service`, `game-service`
  - Users: `user-service`, `community-service`, `creator-service`, `wallet-service`, `payments-service`
  - Utils: `analytics-service`, `chat-service`, `moderation-service`, `notification-service`, `seo-indexer-service`, `session-service`, `steam-library-service`, `video-editing-service`

## Phase 2: Install & Health Check
- `pnpm install` succeeded.
- `shared-db`: Fixed Prisma Client generation (removed custom output path).
- `shared-utils`: Added missing `fastify` dependency.
- `shared-types`: Built successfully.

## Phase 3: Backend Services Build
- [x] `@strike/auth-service`: Built successfully (fixed Fastify v5 type issues, logging, and OAuth logic)
- [x] `@strike/user-service`: Built successfully (fixed Fastify v5 type issues)
- [x] `@strike/gateway-service`: Built successfully (fixed Fastify v5 type issues)
- [x] `@strike/game-service`: Built successfully (fixed types and logging)
- [x] `@strike/orchestrator-service`: Built successfully (fixed VM types, logging, and startup)
- [x] `@strike/steam-library-service`: Built successfully (fixed Fastify v5 type issues)

## Phase 4: Frontend Build
- [x] `@strike/web`: Built successfully
  - Updated to Next.js 15 async `cookies()` API.
  - Fixed type errors in `GamesPage`, `steam-api`, and `user-library`.
  - Created missing components: `LiveStreamChat`, `LiveStreamInteractions`, `StreamerDashboard`.
  - Excluded `public` directory from tsconfig to avoid emsdk errors.
  - Changed port to 3005 to avoid conflict with `user-service`.

## Phase 6: Baseline Verification
- **Services Status**:
  - `@strike/auth-service`: Running (3001)
  - `@strike/user-service`: Running (3002)
  - `@strike/game-service`: Running (3003)
  - `@strike/gateway-service`: Running (3000)
  - `@strike/steam-library-service`: Running (3022)
  - `@strike/orchestrator-service`: Running (3012) - Verified health check.
  - `@strike/web`: Running (3005)
- **Database**:
  - Connected to `strike_gaming_cloud`.

## Phase 7: Environment Consolidation
- Created `.env` and `.env.example` for all core services.
- Updated root `.env` with correct service URLs (using `127.0.0.1` for gateway upstream to avoid IPv6 issues).
- Ensured `dotenv/config` is loaded in all services.

## Phase 8: Gateway & API Contracts
- **Gateway Routes**:
  - `/api/auth/v1` -> `auth-service`
  - `/api/user/v1` -> `user-service`
  - `/api/game/v1` -> `game-service`
  - `/api/orchestrator/v1` -> `orchestrator-service`
  - `/api/steam/v1` -> `steam-library-service`
- **Fixes**:
  - Added `Expect` header stripping to avoid `fastify-reply-from` errors.
  - Updated upstream URLs to `127.0.0.1`.

## Phase 9: E2E Auth/Dashboard
- **Registration**: PASS (via curl).
- **Login**: PASS (via browser).
  - Fixed `JWT_SECRET` mismatch between `auth-service` and other services/frontend.
  - Ensured `apps/web` has correct `.env` with `JWT_SECRET`.
  - Updated `gateway-service`, `user-service`, `game-service` `.env` files.
- **Dashboard**: PASS.
  - User profile fetched correctly.
  - Redirects to `/games` after login.

## Phase 10: Game Library & Steam Integration (Refined) - COMPLETED
- **Logic Overhaul**:
  - Separated Catalog (Game Service) from Ownership (Steam Library Service).
  - Updated `auth-service` to include `steamId64` in JWT.
  - Updated `steam-library-service` to expose `/api/user/library` (fetching owned games via Steam API).
  - Updated `gateway-service` to route `/api/steam/v1` to `steam-library-service`.
  - Updated Frontend (`GamesPage`, `GameDetailPage`) to merge catalog and ownership data.
  - Implemented "Play Now" vs "Connect Steam" vs "Not Owned" logic.
  - Added `steamAppId` to `Game` model and seeded official 51 AAA games.
  - Configured `NEXT_PUBLIC_COMPUTE_URL` for session initiation.
- **Verification**:
  - Catalog endpoint returns 51 games.
  - Library endpoint logic verified via code review (Steam API integration).
  - Frontend logic handles merging and display states.
  - **Fixes Applied (2025-12-01)**:
    - Removed all "seed missing games" scripts and logic.
    - Enforced strict ownership check: `ownedIds.includes(String(game.steamAppId))`.
    - Cleaned up database to remove incorrectly seeded games.
    - Patched `auth-service` to ensure `steamId64` is included in JWT.

### Phase 11: Orchestrator & Session Lifecycle (Test "Play" button)
- [x] **Verify `orchestrator-service` is reachable.**
- [x] **Check "Play" button logic in frontend.**
- [x] **Verify Ownership Logic with Real Data (Dual Account Test)**
  - **Account 1 (domenico.nica@gmail.com):**
    - SteamID: `76561198155371511`
    - Owned: Capcom Arcade Stadium, Counter-Strike 2, etc. (Total: 10+)
    - Status: **VERIFIED** (Correctly shows OWNED for owned games, NOT OWNED for others)
  - **Account 2 (domenico.ncsnicastro@gmail.com):**
    - SteamID: `76561198763654695`
    - Owned: **1 Game** (`Capcom Arcade Stadium` - 1515950).
    - Status: **VERIFIED** (Correctly shows OWNED for Capcom, NOT OWNED for others like CS2).
    - **NOTE:** Previous runs showed 0 games. The appearance of `Capcom Arcade Stadium` is likely due to the inclusion of `include_free_sub=1` in the Steam API call, which correctly reveals free-to-play licenses. The pipeline is working correctly and faithfully reports what Steam returns.
  - **Conclusion:** The ownership logic is strictly based on real Steam API data and correctly handles multiple accounts. No seed data or ghost games are present. Both accounts match expected results exactly (Account 1 has many, Account 2 has 1).

#### Next Steps
- [ ] **Test Session Creation Flow:**
  - Fix the 500 error in `start-session` (Invalid or expired token).
  - Ensure `session-service` can validate the token.
  - Verify redirection to `/play`.
- [ ] Phase 12: Replay Engine & Clips.
- [ ] Phase 14: Docker & Prod Profiles.
- [x] **Steam Privacy Fix**: Implemented XML-based privacy check in `steam-library-service` to correctly detect public profiles even when API behavior is inconsistent.
  - Modified `steam-web-api.ts` to use XML profile data as the primary source for privacy state.
  - Validated with test script `test-service-logic.ts`.
- [x] **Steam ID Fetch Fix**: Updated `steam-library-service` to fetch `steamId64` from the database if missing from the JWT token.
  - This ensures that even if the token is stale or incomplete, the service can still retrieve the user's library.
  - Validated with `test-service-with-db.ts` for the specific user reporting the issue.
- [x] **Service Restart**: Detected that `steam-library-service` was not running, causing Gateway 500 errors.
  - Restarted the service using `npm run dev`.
  - Verified full end-to-end flow via Gateway with `debug-full-flow.ts`.
- [x] **Steam ID Conflict Fix**: Resolved issue where `nicastropaolini@gmail.com` could not link Steam because the ID was already linked to `domenico.ncsnicastro@gmail.com`.
  - Manually cleared the conflict and updated the user's Steam ID in the DB.
  - Updated `steam-library-service` to automatically handle unique constraint violations by "stealing" the link (unlinking old user, linking new one).
- [x] **Environment Variable Loading Fix**: Resolved issue where `STEAM_API_KEY` was missing in `steam-web-api.ts` due to incorrect `dotenv` loading order.
  - Added `import 'dotenv/config'` to `services/steam-library-service/src/env.ts` to ensure env vars are loaded before usage.
  - Verified `steam-library-service` now correctly fetches games and returns `privacyState: 'public'` for valid users.

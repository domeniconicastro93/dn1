# Strike AI Agent - Internal Phase Checklists

## PHASE 1 – Figma & Requirements Analysis
- [ ] Parse Figma prototype (screens, flows, components, states)
- [ ] Extract product brief/pitch content
- [ ] Map Figma frames to routes and components
- [ ] Identify all user flows (auth, gaming, replay, editing, feed, payments)
- [ ] Document edge cases and modal/overlay states
- [ ] Create component inventory
- [ ] Map to backend API calls
- [ ] Validate against master prompt requirements

## PHASE 2 – Web Frontend (Next.js 15)
- [ ] Setup Next.js 15 with App Router
- [ ] Configure TypeScript strict mode
- [ ] Setup TailwindCSS + shadcn/ui
- [ ] Configure next-intl for 17 languages
- [ ] Implement all page routes (/, /feed, /games, /play, /clips, /live, /creator/[handle], /pricing, /wallet, /auth/*, /account, /community, /legal/*)
- [ ] SEO: SSR, canonical URLs, hreflang tags, schema.org structured data
- [ ] SEM landing page templates (/lp/[locale]/[campaign]/[slug])
- [ ] Image optimization and lazy loading
- [ ] Streaming/Suspense APIs
- [ ] Edge caching strategy (TTL rules)
- [ ] All user-facing strings translatable (keys, not hardcoded)

## PHASE 3 – Mobile App (React Native / Expo)
- [ ] Setup React Native + Expo
- [ ] TypeScript configuration
- [ ] Navigation (React Navigation)
- [ ] Tab bar: Feed, Live, Games, Community, Profile
- [ ] Vertical Reels feed (swipe up/down, 60 FPS, preload)
- [ ] Live streaming viewer with chat
- [ ] Clip creation + editing UI (instructions only)
- [ ] Cloud gaming access (deep-link/overlay)
- [ ] Wallet + payments UI
- [ ] Language switch
- [ ] Translation JSON (mirroring web keys)
- [ ] All API calls match web contracts

## PHASE 4 – Backend Microservices & API Contracts
- [ ] Define OpenAPI/JSON schema for all services
- [ ] gateway-service (auth, rate limiting, routing, geo rules)
- [ ] auth-service (register, login, refresh, logout, password reset)
- [ ] user-service
- [ ] payments-service (FIAT only, Stripe, geo rules: no RU payments, CN handling)
- [ ] wallet-service
- [ ] game-service
- [ ] session-service (logical gaming sessions)
- [ ] orchestrator-service (GPU VM lifecycle - see Phase 5)
- [ ] streaming-ingest-service
- [ ] replay-engine-service
- [ ] video-editing-service
- [ ] clip-service
- [ ] feed-service (For You, Following, Explore)
- [ ] creator-service
- [ ] community-service
- [ ] chat-service
- [ ] moderation-service
- [ ] analytics-service
- [ ] notification-service
- [ ] seo-indexer-service
- [ ] Standard response envelope: { data, meta } / { error: { code, message, details } }
- [ ] JWT authentication
- [ ] Rate limiting (public: 60 req/min/IP, authenticated: higher)
- [ ] Idempotency keys for payments/replay
- [ ] Event bus integration (Kafka/NATS)

## PHASE 5 – Cloud Gaming Orchestrator & Streaming
- [ ] VM state machine (TEMPLATE → PROVISIONING → BOOTING → READY → IN_USE → DRAINING → ERROR/TERMINATED)
- [ ] CreateVM, AssignSessionToVM, MarkVMReady, MarkVMDraining, TerminateVM, HandleVMError
- [ ] Multi-region support with fallback logic
- [ ] Regional capacity metrics
- [ ] GPU templates (L4-360, L4-90, A10, A16, RTX-4060, RTX-4080)
- [ ] Per-game settings (resolution, FPS, bitrate, encoder preset, max concurrent sessions)
- [ ] Multi-user orchestration per VM (2-4 sessions/VM)
- [ ] Error handling (provisioning timeout, boot failure, agent crash, network degradation)
- [ ] Events: VMProvisioned, VMReady, VMError, VMPoolLowCapacity, VMTerminated
- [ ] WebRTC + HLS streaming with CDN

## PHASE 6 – Replay & Editing Engine
- [ ] Circular buffer (90-120s in RAM, GStreamer/FFmpeg)
- [ ] Duplicate encoded stream (client + buffer)
- [ ] SaveReplay trigger (sessionId, userId, gameId, timestamp)
- [ ] NVENC parameters (H.264/HEVC, low-latency, CBR/VBR, GOP structure)
- [ ] Output: MP4, upload to object storage
- [ ] ReplayCreated event
- [ ] Video editing service: JSON instructions (trim, texts, stickers, filters, audio)
- [ ] Coordinate system [0-1], safe areas
- [ ] Layering order (video → filters → stickers → text → UI)
- [ ] DPI & font rendering (scales with resolution)
- [ ] Audio ducking rules (gameAudio 0.5, music 1.0)
- [ ] Server-side render pipeline (download, trim, apply overlays, mix audio, encode, thumbnail, upload)
- [ ] RenderCompleted event
- [ ] Retry queue for failed renders

## PHASE 7 – Recommendation & Feed System
- [ ] Scoring model signals (watchTimeRatio, completion, like/dislike/share/comment, rewatchCount, followedCreator, sameGamePreferenceScore, freshness, localeMatch, sessionContext, premiumUserBoost, creatorQualityScore, diversityPenalty)
- [ ] Scoring formula with weights (w1-w14, tuned experimentally)
- [ ] Freshness boost (exponential decay)
- [ ] Repetition penalty
- [ ] Diversity penalty
- [ ] Cold start (new content: prior averages, initial boost; new users: popularity baseline, region/language, early interactions)
- [ ] For You, Following, Explore endpoints
- [ ] Integration with moderation (creatorQualityScore, trustScore)

## PHASE 8 – SEO/SEM, Landing Pages, Analytics
- [ ] Landing page templates (/lp/[locale]/[campaign]/[slug])
- [ ] Keyword clusters per locale
- [ ] Hreflang matrix & sitemaps (sitemap.xml, sitemap-games-<locale>.xml, sitemap-creators-<locale>.xml, sitemap-lp-<locale>.xml)
- [ ] Auto-refresh sitemaps (new games, popular clips, creator profiles)
- [ ] Server-side analytics pipeline (PageView, SignUp, PlaySessionStart, ReplaySaved, ReelPublished, PaymentCompleted)
- [ ] GA4 integration (server-side + optional client-side)
- [ ] TTL caching rules (public: 60-300s stale-while-revalidate, personalized: no edge cache)
- [ ] Schema.org structured data (VideoObject, VideoGame, Person, BroadcastEvent)
- [ ] Microdata for clips, reels, live streams

## PHASE 9 – Infrastructure (Docker, K8s, Terraform)
- [ ] Dockerfiles per service (lightweight images)
- [ ] K8s manifests (Deployments, Services, Ingress/Gateway, ConfigMaps, Secrets)
- [ ] Terraform (DBs, Redis, message bus, object storage, CDN)
- [ ] CI/CD pipeline (build images, run tests, deploy staging/production)
- [ ] Observability stack (Prometheus, Grafana, Loki, OpenTelemetry)
- [ ] Multi-region deployment configs

## PHASE 10 – QA & Bugfixing
- [ ] Scan code for bugs, inconsistent types, unused imports, unhandled errors
- [ ] Unit tests for core functions
- [ ] Integration tests (auth, payment, replay flows)
- [ ] Fix bugs with comments explaining what was wrong
- [ ] Avoid regressions (don't break public contracts)
- [ ] Type safety validation
- [ ] Performance testing
- [ ] Security audit

## Cross-Phase Requirements (All Phases)
- [ ] Never break existing code (read before changing, preserve contracts)
- [ ] File management (never delete important files without migration, deprecate old code)
- [ ] Architectural consistency (shared patterns, naming conventions)
- [ ] Multi-language support (all user-facing strings translatable)
- [ ] SEO-ready (SSR, canonical, hreflang, structured data)
- [ ] Security-by-design (auth, RBAC, rate limiting, audit logs)
- [ ] Observability (metrics, logs, traces)
- [ ] Scalable (stateless, horizontal scaling, multi-region)
- [ ] Idempotent & resilient (retries, circuit breakers, backoff)


/**
 * Session Manager - Core Session Orchestration
 * 
 * ⚠️ DEPRECATED: Sunshine and Apollo integration
 * 
 * This file previously integrated with Sunshine and Apollo for game streaming.
 * These systems have been REPLACED by the new WebRTC Streaming Service.
 * 
 * TODO: Remove all Sunshine/Apollo code and integrate with WebRTC service at:
 *       services/webrtc-streaming-service (port 3015)
 * 
 * Responsibilities:
 * - Create/start sessions
 * - Monitor session status
 * - Stop/cleanup sessions
 * - Coordinate VM allocation and WebRTC streaming
 */

import { randomUUID } from 'crypto';
import type {
    CloudGamingSession,
    SessionState,
    SessionStartRequest,
    SessionStartResponse,
    SessionStatusResponse,
    SessionStopRequest,
    SessionStopResponse,
} from '../types/webrtc';
import { getVMProvider, type VMInfo } from './vm-provider';

// ❌ DEPRECATED: Sunshine integration removed
// import { createSunshineClient, type SunshineClient } from './sunshine-client';

// ❌ DEPRECATED: Apollo integration removed  
// import { createApolloClient, type ApolloClient } from '../apollo/apollo-client';

// Stub types for backward compatibility during migration
type SunshineClient = any;
type ApolloClient = any;

/**
 * In-memory session store
 * 
 * Phase 11.A3: Simple in-memory map
 * Future: Use database (Prisma) for persistence
 */
class SessionStore {
    private sessions: Map<string, CloudGamingSession> = new Map();

    set(sessionId: string, session: CloudGamingSession): void {
        this.sessions.set(sessionId, session);
    }

    get(sessionId: string): CloudGamingSession | undefined {
        return this.sessions.get(sessionId);
    }

    delete(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    getAll(): CloudGamingSession[] {
        return Array.from(this.sessions.values());
    }

    getUserSessions(userId: string): CloudGamingSession[] {
        return this.getAll().filter(s => s.userId === userId);
    }
}

/**
 * Session Manager
 * 
 * Phase 11.A3: Real Sunshine integration
 */
export class SessionManager {
    private static instance: SessionManager;
    private sessionStore: SessionStore;
    private vmProvider: ReturnType<typeof getVMProvider>;
    private sunshineClients: Map<string, SunshineClient>; // vmHost -> client
    private statusPollers: Map<string, NodeJS.Timeout>; // sessionId -> interval

    private constructor() {
        this.sessionStore = new SessionStore();
        this.vmProvider = getVMProvider();
        this.sunshineClients = new Map();
        this.statusPollers = new Map();

        console.log('[SessionManager] Initialized');

        // Start cleanup job (every 5 minutes)
        setInterval(() => {
            this.cleanupExpiredSessions(60).catch(err => {
                console.error('[SessionManager] Cleanup error:', err);
            });
        }, 5 * 60 * 1000);
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Get or create Sunshine client for a VM
     * 
     * ❌ DEPRECATED: Sunshine integration removed
     * This method now returns null. Use WebRTC service instead.
     */
    private getSunshineClient(vmHost: string): SunshineClient {
        // ❌ DEPRECATED: Sunshine removed
        // TODO: Replace with WebRTC service integration
        return null as any;
    }

    /**
     * Start status polling for a session
     * 
     * ❌ DEPRECATED: Disabled because Sunshine/Apollo are removed
     * WebRTC sessions don't need polling - they use connection state events
     */
    private startStatusPolling(sessionId: string, vmHost: string): void {
        // ❌ DISABLED: Sunshine polling removed
        // WebRTC sessions handle their own connection state
        console.log('[SessionManager] ⚠️ Status polling disabled (Sunshine deprecated)');
        return;

        /* DEPRECATED CODE - Kept for reference
        const interval = setInterval(async () => {
            try {
                const session = this.sessionStore.get(sessionId);
                if (!session || session.state !== 'ACTIVE') {
                    this.stopStatusPolling(sessionId);
                    return;
                }

                const client = this.getSunshineClient(vmHost);
                const status = await client.getSessionStatus(sessionId);

                if (!status.active && session.state === 'ACTIVE') {
                    console.log('[SessionManager] Session became inactive:', sessionId);
                    session.state = 'ERROR';
                    session.updatedAt = new Date();
                    session.metadata.error = {
                        code: 'SESSION_INACTIVE',
                        message: 'Session became inactive',
                        timestamp: new Date(),
                    };
                    this.sessionStore.set(sessionId, session);
                }
            } catch (error) {
                console.error('[SessionManager] Status poll error:', error);
            }
        }, 2000);

        this.statusPollers.set(sessionId, interval);
        console.log('[SessionManager] Started status polling for session:', sessionId);
        */
    }

    /**
     * Stop status polling for a session
     */
    private stopStatusPolling(sessionId: string): void {
        const interval = this.statusPollers.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.statusPollers.delete(sessionId);
            console.log('[SessionManager] Stopped status polling for session:', sessionId);
        }
    }

    /**
     * Start a new cloud gaming session
     * 
     * Phase 11.A3: Real Sunshine integration
     * 
     * @param request - Session start request
     * @returns Session start response
     */
    async startSession(request: SessionStartRequest): Promise<SessionStartResponse> {
        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] START SESSION REQUEST');
        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] User ID:', request.userId);
        console.log('[SessionManager] App ID:', request.appId);
        console.log('[SessionManager] Steam App ID:', request.steamAppId);

        const { userId, appId, steamAppId, region, deviceInfo } = request;

        // STEP 1: Allocate VM
        console.log('[SessionManager] STEP 1: Allocating VM...');
        const vmAllocation = await this.vmProvider.allocateVM({
            userId,
            appId,
            region,
        });

        if (!vmAllocation.allocated) {
            throw new Error(`VM allocation failed: ${vmAllocation.error}`);
        }

        const vm = vmAllocation.vm;
        console.log('[SessionManager] ✅ VM allocated:', vm.id, '(', vm.host, ')');

        // STEP 2: Create session ID
        const sessionId = randomUUID();
        console.log('[SessionManager] STEP 2: Session ID created:', sessionId);


        // STEP 3: Skip Sunshine client initialization
        // Moonlight will connect directly to Sunshine
        console.log('[SessionManager] STEP 3: Skipping Sunshine client (Moonlight handles connection)');

        // STEP 4: Skip authentication
        // With pairing bypass (require_pairing=false), Moonlight connects directly
        console.log('[SessionManager] STEP 4: Skipping Sunshine authentication (pairing bypassed)');

        // STEP 5: Launch game on Apollo
        console.log('[SessionManager] STEP 5: Launching game on Apollo...');

        // Map gameId to Apollo app name
        const gameToApolloApp: Record<string, string> = {
            'c215d61e-df8b-4f3c-b23e-3bc999c5f7da': 'CapcomArcadeStadium', // Capcom Arcade Stadium
            'steam': 'Steam',
            'steam-big-picture': 'Steam'
        };

        const apolloAppName = gameToApolloApp[appId] || 'CapcomArcadeStadium';
        console.log(`[SessionManager] Mapped appId ${appId} → Apollo app: ${apolloAppName}`);

        // ❌ DEPRECATED: Apollo integration removed
        // TODO: Replace with WebRTC service game launch
        /*
        const apolloClient = createApolloClient();
        const launchResult = await apolloClient.launchApp(apolloAppName);

        if (!launchResult.success) {
            console.error(`[SessionManager] Failed to launch game on Apollo:`, launchResult.error);
            // Continue anyway - game might already be running
            console.log('[SessionManager] Continuing despite launch error (game might be running)');
        } else {
            console.log(`[SessionManager] ✅ Game launched successfully on Apollo`);
        }
        */
        console.log('[SessionManager] ⚠️ Apollo integration disabled - using WebRTC service');

        // Wait a bit for the game to start
        console.log('[SessionManager] Waiting 2 seconds for game to initialize...');
        await new Promise(resolve => setTimeout(resolve, 2000));


        // STEP 6: Create session object
        console.log('[SessionManager] STEP 6: Creating session object...');
        const session: CloudGamingSession = {
            sessionId,
            userId,
            appId,
            steamAppId,
            vmId: vm.id,
            state: 'ACTIVE',
            webrtc: {
                host: vm.host,
                streamPort: parseInt(process.env.SUNSHINE_STREAM_PORT || '47984', 10),
                webPort: parseInt(process.env.SUNSHINE_WEB_PORT || '47985', 10),
                useHttps: process.env.SUNSHINE_USE_HTTPS === 'true',
                iceServers: [
                    {
                        urls: 'stun:stun.l.google.com:19302',
                    },
                ],
            },
            metadata: {
                vmHost: vm.host,
                deviceInfo,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // STEP 7: Store session
        this.sessionStore.set(sessionId, session);
        console.log('[SessionManager] ✅ Session stored');

        // STEP 8: Start status polling
        console.log('[SessionManager] STEP 7: Starting status polling...');
        this.startStatusPolling(sessionId, vm.host);

        // STEP 9: Return response
        const response: SessionStartResponse = {
            sessionId,
            state: session.state,
            sunshineHost: vm.host,
            sunshinePort: session.webrtc.webPort, // PHASE 11 FINAL: Sunshine Web/API port (47985)
            sunshineStreamPort: session.webrtc.streamPort,
            appIndex: 1, // PHASE 11 FINAL: Steam is app #1 in Sunshine /api/apps
            webrtc: {
                iceServers: session.webrtc.iceServers,
            },
            appId,
            steamAppId,

            // MOONLIGHT CLIENT COMPATIBILITY (now NoVNC)
            host: vm.host,
            port: 5900, // TightVNC port for NoVNC streaming
            useHttps: false, // VNC doesn't use HTTPS
            udpPorts: [], // VNC uses TCP only
        };

        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] SESSION STARTED SUCCESSFULLY');
        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] Session ID:', sessionId);
        console.log('[SessionManager] Sunshine Host:', vm.host);
        console.log('[SessionManager] Stream Port:', session.webrtc.streamPort);
        console.log('[SessionManager] WebRTC URL: http://' + vm.host + ':' + session.webrtc.streamPort);
        console.log('[SessionManager] ========================================');

        return response;
    }

    /**
     * Get session status
     * 
     * Phase 11.C: Enhanced with health checks and error details
     * 
     * @param sessionId - Session ID
     * @returns Session status
     */
    async getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
        console.log('[SessionManager] getSessionStatus() called');
        console.log('[SessionManager] Session ID:', sessionId);

        const session = this.sessionStore.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        // Calculate duration
        const duration = Math.floor((Date.now() - session.createdAt.getTime()) / 1000);

        // Perform health checks
        let health: SessionStatusResponse['health'];
        try {
            const sunshineClient = this.getSunshineClient(session.metadata.vmHost);
            const connectionTest = await sunshineClient.testConnection();

            health = {
                vmReachable: true, // If we got here, VM is reachable
                sunshineReachable: connectionTest.connected,
                streamActive: session.state === 'ACTIVE',
            };
        } catch (error) {
            health = {
                vmReachable: false,
                sunshineReachable: false,
                streamActive: false,
            };
        }

        const response: SessionStatusResponse = {
            sessionId: session.sessionId,
            state: session.state,
            sunshineHost: session.metadata.vmHost,
            sunshineStreamPort: session.webrtc.streamPort,
            webrtc: {
                iceServers: session.webrtc.iceServers,
            },
            appId: session.appId,
            steamAppId: session.steamAppId,
            createdAt: session.createdAt.toISOString(),
            duration,
            health,
        };

        // Add error details if session is in ERROR state
        if (session.state === 'ERROR' && session.metadata.error) {
            response.error = {
                code: session.metadata.error.code,
                message: session.metadata.error.message,
                details: session.metadata.error.timestamp.toISOString(),
            };
        }

        console.log('[SessionManager] Session status:', {
            sessionId,
            state: session.state,
            duration,
            health,
        });

        return response;
    }

    /**
     * Stop a session
     * 
     * Phase 11.A3: Real Sunshine integration
     * 
     * @param request - Session stop request
     * @returns Session stop response
     */
    async stopSession(request: SessionStopRequest): Promise<SessionStopResponse> {
        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] STOP SESSION REQUEST');
        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] Session ID:', request.sessionId);
        console.log('[SessionManager] Reason:', request.reason || 'user_exit');

        const { sessionId, reason } = request;

        const session = this.sessionStore.get(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        // STEP 1: Stop status polling
        console.log('[SessionManager] STEP 1: Stopping status polling...');
        this.stopStatusPolling(sessionId);

        // STEP 2: Stop Sunshine application
        console.log('[SessionManager] STEP 2: Stopping Sunshine application...');
        const sunshineClient = this.getSunshineClient(session.metadata.vmHost);
        try {
            await sunshineClient.stopApplication();
            console.log('[SessionManager] ✅ Sunshine application stopped');
        } catch (error) {
            console.error('[SessionManager] ⚠️  Failed to stop Sunshine application:', error);
            // Continue with cleanup anyway
        }

        // STEP 3: Release VM
        console.log('[SessionManager] STEP 3: Releasing VM...');
        await this.vmProvider.releaseVM(session.vmId, sessionId);
        console.log('[SessionManager] ✅ VM released');

        // STEP 4: Update session state
        session.state = 'ENDED';
        session.endedAt = new Date();
        session.updatedAt = new Date();
        this.sessionStore.set(sessionId, session);

        console.log('[SessionManager] ========================================');
        console.log('[SessionManager] SESSION STOPPED SUCCESSFULLY');
        console.log('[SessionManager] ========================================');

        return {
            success: true,
            sessionId,
            state: session.state,
            message: `Session stopped: ${reason || 'user_exit'}`,
        };
    }

    /**
     * Get all active sessions
     * 
     * @returns List of active sessions
     */
    async getActiveSessions(): Promise<CloudGamingSession[]> {
        return this.sessionStore.getAll().filter(s => s.state === 'ACTIVE');
    }

    /**
     * Get user's active sessions
     * 
     * @param userId - User ID
     * @returns List of user's active sessions
     */
    async getUserActiveSessions(userId: string): Promise<CloudGamingSession[]> {
        return this.sessionStore.getUserSessions(userId).filter(s => s.state === 'ACTIVE');
    }

    /**
     * Cleanup expired sessions
     * 
     * @param maxAgeMinutes - Maximum session age in minutes
     */
    async cleanupExpiredSessions(maxAgeMinutes: number = 60): Promise<number> {
        console.log('[SessionManager] cleanupExpiredSessions() called');

        const now = Date.now();
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        let cleanedCount = 0;

        const allSessions = this.sessionStore.getAll();

        for (const session of allSessions) {
            if (session.state === 'ACTIVE') {
                const age = now - session.createdAt.getTime();
                if (age > maxAgeMs) {
                    console.log('[SessionManager] Cleaning up expired session:', session.sessionId);
                    await this.stopSession({
                        sessionId: session.sessionId,
                        reason: 'timeout',
                    });
                    cleanedCount++;
                }
            }
        }

        console.log('[SessionManager] Cleaned up', cleanedCount, 'expired sessions');
        return cleanedCount;
    }
}

/**
 * Get session manager instance
 */
export function getSessionManager(): SessionManager {
    return SessionManager.getInstance();
}

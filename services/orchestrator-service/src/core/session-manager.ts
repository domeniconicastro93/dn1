/**
 * Session Manager - Core Session Orchestration
 * 
 * Phase 11.A3: Real Sunshine integration with session lifecycle
 * 
 * Responsibilities:
 * - Create/start sessions
 * - Monitor session status
 * - Stop/cleanup sessions
 * - Coordinate VM allocation and Sunshine client
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
import { createSunshineClient, type SunshineClient } from './sunshine-client';

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
     */
    private getSunshineClient(vmHost: string): SunshineClient {
        if (!this.sunshineClients.has(vmHost)) {
            const client = createSunshineClient({ host: vmHost });
            this.sunshineClients.set(vmHost, client);
        }
        return this.sunshineClients.get(vmHost)!;
    }

    /**
     * Start status polling for a session
     */
    private startStatusPolling(sessionId: string, vmHost: string): void {
        // Poll every 2 seconds
        const interval = setInterval(async () => {
            try {
                const session = this.sessionStore.get(sessionId);
                if (!session || session.state !== 'ACTIVE') {
                    this.stopStatusPolling(sessionId);
                    return;
                }

                const client = this.getSunshineClient(vmHost);
                const status = await client.getSessionStatus(sessionId);

                // Update session state if needed
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

        // STEP 3: Get Sunshine client
        console.log('[SessionManager] STEP 3: Getting Sunshine client...');
        const sunshineClient = this.getSunshineClient(vm.host);

        // STEP 4: Authenticate with Sunshine
        console.log('[SessionManager] STEP 4: Authenticating with Sunshine...');
        try {
            const authResult = await sunshineClient.login();
            console.log('[SessionManager] ✅ Sunshine authenticated:', authResult.authenticated);
            console.log('[SessionManager]    Version:', authResult.version);
            console.log('[SessionManager]    Apps:', authResult.apps?.length || 0);
        } catch (error) {
            console.error('[SessionManager] ❌ Sunshine authentication failed:', error);
            // Release VM
            await this.vmProvider.releaseVM(vm.id, sessionId);
            throw new Error(`Failed to authenticate with Sunshine: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // STEP 5: Launch game
        if (steamAppId) {
            console.log('[SessionManager] STEP 5: Launching game...');
            console.log('[SessionManager]    Steam App ID:', steamAppId);
            try {
                await sunshineClient.launchSteamGame(steamAppId);
                console.log('[SessionManager] ✅ Game launched successfully');
            } catch (error) {
                console.error('[SessionManager] ❌ Game launch failed:', error);
                // Release VM
                await this.vmProvider.releaseVM(vm.id, sessionId);
                throw new Error(`Failed to launch game: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            console.log('[SessionManager] STEP 5: No Steam App ID provided, skipping game launch');
        }

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

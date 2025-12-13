/**
 * Session Management Routes for Orchestrator Service
 * 
 * ✅ UPDATED: Uses centralized WebRTC client
 * Single source of truth for WebRTC session management
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse, ErrorCodes } from '@strike/shared-utils';
import { getWebRTCClient } from '../core/webrtc-client';
import { getVMAgentClient } from '../core/vm-agent-client';
import { getSessionManager } from '../core/session-manager';
import type {
    SessionStartRequest,
    SessionStopRequest,
} from '../types/webrtc';

interface SessionStatusParams {
    sessionId: string;
}

// Configuration
const LAUNCH_DELAY_MS = parseInt(process.env.LAUNCH_DELAY_MS || '1500', 10);

/**
 * Register session routes
 */
export function registerSessionRoutes(app: FastifyInstance) {
    const webrtcClient = getWebRTCClient();
    const vmAgentClient = getVMAgentClient(); // VM Agent for game launch
    const sessionManager = getSessionManager(); // For status/stop endpoints

    /**
     * POST /api/orchestrator/v1/session/start
     * 
     * Start a new cloud gaming session using WebRTC
     * ✅ UPDATED: Uses shared WebRTC client (single source of truth)
     */
    app.post<{ Body: SessionStartRequest }>(
        '/api/orchestrator/v1/session/start',
        async (request: FastifyRequest<{ Body: SessionStartRequest }>, reply: FastifyReply) => {
            const { userId, appId, steamAppId } = request.body;

            app.log.info({ userId, appId, steamAppId }, 'Session start requested (WebRTC)');

            if (!userId || !appId) {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId and appId are required')
                );
            }

            try {
                // Generate session ID
                const sessionId = require('crypto').randomUUID();

                console.log('[SessionRoute] Starting full Play Now flow for session:', sessionId);

                // STEP 1: Check VM Agent health (fail fast)
                console.log('[SessionRoute] Step 1: Checking VM Agent health...');
                const health = await vmAgentClient.health();

                if (!health.ok) {
                    console.error('[SessionRoute] ❌ VM Agent health check failed:', health.error);
                    return reply.status(503).send(
                        errorResponse(
                            ErrorCodes.SERVICE_UNAVAILABLE,
                            `VM Agent unavailable: ${health.error || 'Unknown error'}`
                        )
                    );
                }

                console.log('[SessionRoute] ✅ VM Agent healthy:', health.hostname);

                // STEP 2: Launch Steam game (if steamAppId provided)
                if (steamAppId) {
                    console.log('[SessionRoute] Step 2: Launching Steam game:', steamAppId);

                    const launchResult = await vmAgentClient.launchGame(steamAppId);

                    if (!launchResult.ok) {
                        console.error('[SessionRoute] ❌ Game launch failed:', launchResult.error);
                        return reply.status(500).send(
                            errorResponse(
                                ErrorCodes.INTERNAL_ERROR,
                                `Failed to launch game: ${launchResult.error || 'Unknown error'}`
                            )
                        );
                    }

                    console.log('[SessionRoute] ✅ Game launched successfully');

                    // STEP 3: Wait for game to initialize
                    console.log(`[SessionRoute] Step 3: Waiting ${LAUNCH_DELAY_MS}ms for game initialization...`);
                    await new Promise(resolve => setTimeout(resolve, LAUNCH_DELAY_MS));
                } else {
                    console.log('[SessionRoute] No steamAppId provided, skipping game launch');
                }

                // STEP 4: Start WebRTC stream capture
                console.log('[SessionRoute] Step 4: Starting WebRTC stream capture...');
                const { offer } = await webrtcClient.startSession(sessionId);

                console.log('[SessionRoute] ✅ Complete Play Now flow successful!');

                // Return WebRTC session info
                return reply.status(200).send(
                    successResponse({
                        sessionId,
                        offer,
                        streamingServiceUrl: webrtcClient.getServiceUrl(),
                        webrtc: {
                            signalingUrl: `${process.env.ORCHESTRATOR_URL || 'http://localhost:3012'}/api/orchestrator/v1/webrtc`,
                        },
                        vmAgent: {
                            hostname: health.hostname,
                            launched: !!steamAppId
                        }
                    })
                );
            } catch (error) {
                app.log.error({ error }, 'Error in Play Now flow');
                return reply.status(500).send(
                    errorResponse(
                        ErrorCodes.INTERNAL_ERROR,
                        `Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                );
            }
        }
    );

    /**
     * POST /api/sessions/request
     * 
     * ALIAS for /api/orchestrator/v1/session/start (for frontend compatibility)
     * ✅ UPDATED: Includes VM Agent launch + WebRTC streaming
     */
    app.post<{ Body: SessionStartRequest }>(
        '/api/sessions/request',
        async (request: FastifyRequest<{ Body: SessionStartRequest }>, reply: FastifyReply) => {
            const { userId, appId, steamAppId } = request.body;

            app.log.info({ userId, appId, steamAppId }, 'Session request (alias: Play Now)');

            if (!userId || !appId) {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId and appId are required')
                );
            }

            try {
                // Generate session ID
                const sessionId = require('crypto').randomUUID();

                console.log('[SessionRoute/Alias] === PLAY NOW FLOW START ===');
                console.log('[SessionRoute/Alias] Session ID:', sessionId);
                console.log('[SessionRoute/Alias] User ID:', userId);
                console.log('[SessionRoute/Alias] App ID:', appId);
                console.log('[SessionRoute/Alias] Steam App ID:', steamAppId);

                // STEP 1: Check VM Agent health (fail fast)
                console.log('[SessionRoute/Alias] Step 1: Checking VM Agent health...');
                const health = await vmAgentClient.health();

                if (!health.ok) {
                    console.error('[SessionRoute/Alias] ❌ VM Agent health check failed:', health.error);
                    return reply.status(503).send(
                        errorResponse(
                            ErrorCodes.SERVICE_UNAVAILABLE,
                            `VM Agent unavailable: ${health.error || 'Unknown error'}`
                        )
                    );
                }

                console.log('[SessionRoute/Alias] ✅ VM Agent healthy:', health.hostname);

                // STEP 2: Launch Steam game (if steamAppId provided)
                if (steamAppId) {
                    console.log('[SessionRoute/Alias] Step 2: Launching Steam game:', steamAppId);

                    const launchResult = await vmAgentClient.launchGame(steamAppId);

                    if (!launchResult.ok) {
                        console.error('[SessionRoute/Alias] ❌ Game launch failed:', launchResult.error);
                        return reply.status(500).send(
                            errorResponse(
                                ErrorCodes.INTERNAL_ERROR,
                                `Failed to launch game: ${launchResult.error || 'Unknown error'}`
                            )
                        );
                    }

                    console.log('[SessionRoute/Alias] ✅ Game launched successfully');

                    // STEP 3: Wait for game to initialize
                    console.log(`[SessionRoute/Alias] Step 3: Waiting ${LAUNCH_DELAY_MS}ms for game initialization...`);
                    await new Promise(resolve => setTimeout(resolve, LAUNCH_DELAY_MS));
                } else {
                    console.log('[SessionRoute/Alias] No steamAppId provided, skipping game launch');
                }

                // STEP 4: Start WebRTC stream capture
                console.log('[SessionRoute/Alias] Step 4: Starting WebRTC stream capture...');
                const { offer } = await webrtcClient.startSession(sessionId);

                console.log('[SessionRoute/Alias] ✅ Complete Play Now flow successful!');
                console.log('[SessionRoute/Alias] === PLAY NOW FLOW END ===');

                // Return WebRTC session info
                return reply.status(200).send(
                    successResponse({
                        sessionId,
                        offer,
                        streamingServiceUrl: webrtcClient.getServiceUrl(),
                        webrtc: {
                            signalingUrl: `${process.env.ORCHESTRATOR_URL || 'http://localhost:3012'}/api/orchestrator/v1/webrtc`,
                        },
                        vmAgent: {
                            hostname: health.hostname,
                            launched: !!steamAppId
                        }
                    })
                );
            } catch (error) {
                console.error('[SessionRoute/Alias] === PLAY NOW FLOW ERROR ===');
                app.log.error({ error }, 'Error in Play Now flow (alias)');
                return reply.status(500).send(
                    errorResponse(
                        ErrorCodes.INTERNAL_ERROR,
                        `Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                );
            }
        }
    );

    /**
     * GET /api/orchestrator/v1/session/status/:sessionId
     * 
     * Get session status
     */
    app.get<{ Params: SessionStatusParams }>(
        '/api/orchestrator/v1/session/status/:sessionId',
        async (request: FastifyRequest<{ Params: SessionStatusParams }>, reply: FastifyReply) => {
            const { sessionId } = request.params;

            app.log.info({ sessionId }, 'Session status requested');

            try {
                const response = await sessionManager.getSessionStatus(sessionId);

                return reply.status(200).send(successResponse(response));
            } catch (error) {
                app.log.error({ error, sessionId }, 'Error getting session status');

                if (error instanceof Error && error.message === 'Session not found') {
                    return reply.status(404).send(
                        errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
                    );
                }

                return reply.status(500).send(
                    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get session status')
                );
            }
        }
    );

    /**
     * POST /api/orchestrator/v1/session/stop
     * 
     * Stop a session
     */
    app.post<{ Body: SessionStopRequest }>(
        '/api/orchestrator/v1/session/stop',
        async (request: FastifyRequest<{ Body: SessionStopRequest }>, reply: FastifyReply) => {
            const { sessionId, reason } = request.body;

            app.log.info({ sessionId, reason }, 'Session stop requested');

            if (!sessionId) {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.VALIDATION_ERROR, 'sessionId is required')
                );
            }

            try {
                const response = await sessionManager.stopSession({
                    sessionId,
                    reason,
                });

                app.log.info({ sessionId }, 'Session stopped successfully');

                return reply.status(200).send(successResponse(response));
            } catch (error) {
                app.log.error({ error, sessionId }, 'Error stopping session');

                if (error instanceof Error && error.message === 'Session not found') {
                    return reply.status(404).send(
                        errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
                    );
                }

                return reply.status(500).send(
                    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to stop session')
                );
            }
        }
    );

    /**
     * GET /api/orchestrator/v1/session/active
     * 
     * Get all active sessions (admin endpoint)
     */
    app.get(
        '/api/orchestrator/v1/session/active',
        async (request: FastifyRequest, reply: FastifyReply) => {
            app.log.info('Active sessions requested');

            try {
                const sessions = await sessionManager.getActiveSessions();

                return reply.status(200).send(successResponse({
                    sessions,
                    count: sessions.length,
                }));
            } catch (error) {
                app.log.error({ error }, 'Error getting active sessions');
                return reply.status(500).send(
                    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get active sessions')
                );
            }
        }
    );
}

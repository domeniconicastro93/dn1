/**
 * Session Management Routes for Orchestrator Service
 * 
 * Phase 11.A3: Real session lifecycle with Sunshine integration
 * 
 * Handles complete gameplay session lifecycle:
 * - Session start (VM allocation + game launch)
 * - Session status monitoring
 * - Session stop (cleanup)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse, ErrorCodes } from '@strike/shared-utils';
import { getSessionManager } from '../core/session-manager';
import type {
    SessionStartRequest,
    SessionStopRequest,
} from '../types/webrtc';

interface SessionStatusParams {
    sessionId: string;
}

/**
 * Register session routes
 */
export function registerSessionRoutes(app: FastifyInstance) {
    const sessionManager = getSessionManager();

    /**
     * POST /api/orchestrator/v1/session/start
     * 
     * Start a new cloud gaming session
     */
    app.post<{ Body: SessionStartRequest }>(
        '/api/orchestrator/v1/session/start',
        async (request: FastifyRequest<{ Body: SessionStartRequest }>, reply: FastifyReply) => {
            // DEBUG: Log the raw request body
            console.log('[DEBUG Session Body]', request.body);

            const { userId, appId, steamAppId } = request.body;

            app.log.info({ userId, appId, steamAppId }, 'Session start requested');

            if (!userId || !appId) {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId and appId are required')
                );
            }

            try {
                const response = await sessionManager.startSession({
                    userId,
                    appId,
                    steamAppId,
                    deviceInfo: {
                        userAgent: request.headers['user-agent'],
                        platform: 'web',
                    },
                });

                app.log.info({ sessionId: response.sessionId }, 'Session started successfully');

                return reply.status(200).send(successResponse(response));
            } catch (error) {
                app.log.error({ error }, 'Error starting session');
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

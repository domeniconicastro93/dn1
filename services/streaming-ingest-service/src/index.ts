/**
 * Streaming Ingest Service
 * 
 * Handles WebRTC signaling, streaming ingest, and control channel.
 * Provides WebRTC URLs for clients to connect to gaming sessions.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  sessionIdParamSchema,
  authMiddleware,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type { AuthenticatedRequest } from '@strike/shared-utils';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'streaming-ingest-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `streaming:${clientId}`,
    RateLimitConfigs.AUTHENTICATED
  );

  if (!result.allowed) {
    reply.status(429).send(
      errorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.'
      )
    );
    return;
  }

  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
};

// WebSocket server for signaling and control
const WS_PORT = parseInt(process.env.WS_PORT || '3014', 10);
const wss = new WebSocketServer({ port: WS_PORT });

// Store active connections
const activeConnections = new Map<string, {
  sessionId: string;
  vmId: string;
  ws: any;
  type: 'signaling' | 'control';
}>();

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const streamId = url.searchParams.get('streamId');
  const type = url.searchParams.get('type') || 'signaling'; // 'signaling', 'control', 'interactions', or 'ingest'

  // Phase 7: Handle live stream ingest connections
  if (type === 'ingest' && streamId) {
    const creatorId = url.searchParams.get('creatorId') || 'unknown';
    
    // Create WebRTC ingest connection
    const { createIngestPeerConnection } = require('./webrtc-ingest');
    createIngestPeerConnection(streamId, creatorId, ws);

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle WebRTC signaling for ingest
        if (data.type === 'offer') {
          // Streamer sent offer, create answer
          // In production, use actual RTCPeerConnection
          ws.send(JSON.stringify({
            type: 'answer',
            sdp: 'mock-sdp-answer',
          }));
        } else if (data.type === 'ice-candidate') {
          ws.send(JSON.stringify({
            type: 'ice-candidate-response',
            candidate: data.candidate,
          }));
        }
      } catch (error) {
        app.log.error('Error handling ingest message:', error);
      }
    });

    ws.on('close', () => {
      const { closeIngestConnection } = require('./webrtc-ingest');
      closeIngestConnection(streamId);
    });

    return;
  }

  // Phase 7: Handle real-time interactions
  if (type === 'interactions' && streamId) {
    joinStreamInteractions(streamId, ws);

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        const userId = data.userId || 'anonymous';

        if (data.type === 'like') {
          await handleLikeInteraction(streamId, userId);
        } else if (data.type === 'reaction') {
          await handleReactionInteraction(streamId, userId, data.reaction);
        }
      } catch (error) {
        app.log.error('Error handling interaction message:', error);
      }
    });

    ws.on('close', () => {
      leaveStreamInteractions(streamId, ws);
    });

    ws.on('error', (error) => {
      app.log.error('Interaction WebSocket error:', error);
      leaveStreamInteractions(streamId, ws);
    });

    return;
  }

  // Existing session-based connections
  if (!sessionId) {
    ws.close(1008, 'sessionId required');
    return;
  }

  const connectionId = `${sessionId}_${type}`;
  activeConnections.set(connectionId, {
    sessionId,
    vmId: '', // Will be set when VM is assigned
    ws,
    type: type as 'signaling' | 'control',
  });

  app.log.info(`WebSocket connection established: ${connectionId}`);

  // Handle WebRTC signaling messages
  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());

      if (type === 'signaling') {
        // WebRTC signaling (offer, answer, ICE candidates)
        handleSignalingMessage(sessionId, data);
      } else if (type === 'control') {
        // Game control input (keyboard, mouse, gamepad)
        handleControlMessage(sessionId, data);
      }
    } catch (error) {
      app.log.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    activeConnections.delete(connectionId);
    app.log.info(`WebSocket connection closed: ${connectionId}`);
  });

  ws.on('error', (error) => {
    app.log.error(`WebSocket error for ${connectionId}:`, error);
    activeConnections.delete(connectionId);
  });

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    connectionType: type,
  }));
});

function handleSignalingMessage(sessionId: string, data: any): void {
  // Phase 7: Handle WebRTC signaling for live streaming ingest
  app.log.info(`Signaling message for session ${sessionId}:`, data);

  const connection = activeConnections.get(`${sessionId}_signaling`);
  if (connection) {
    // Handle SDP offer/answer
    if (data.type === 'offer') {
      // Streamer is sending offer, create answer
      // In production, this would use actual RTCPeerConnection
      connection.ws.send(JSON.stringify({
        type: 'answer',
        sdp: 'mock-sdp-answer',
      }));
    } else if (data.type === 'ice-candidate') {
      // Handle ICE candidate
      connection.ws.send(JSON.stringify({
        type: 'ice-candidate-response',
        candidate: data.candidate,
      }));
    } else {
      // Echo back for other message types
      connection.ws.send(JSON.stringify({
        type: 'signaling-response',
        data,
      }));
    }
  }
}

function handleControlMessage(sessionId: string, data: any): void {
  // TODO: Implement game control input handling
  // - Keyboard input
  // - Mouse input
  // - Gamepad input
  // - Forward to VM
  app.log.info(`Control message for session ${sessionId}:`, data);

  const connection = activeConnections.get(`${sessionId}_control`);
  if (connection) {
    // In production, forward to VM control channel
    app.log.info(`Forwarding control input to VM ${connection.vmId}`);
  }
}

// POST /api/streaming/v1/session/:sessionId/stream-url - Get WebRTC stream URL
app.post<{ Params: { sessionId: string } }>(
  '/api/streaming/v1/session/:sessionId/stream-url',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate params
      const validationResult = sessionIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid session ID format',
            validationResult.error.errors
          )
        );
      }

      const { sessionId } = validationResult.data;

      // Verify session exists in database
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { game: true },
      });

      if (!session) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      // Get VM info from session
      const vmId = session.vmId;
      if (vmId) {
        // Update active connections with VM ID
        const signalingConn = activeConnections.get(`${sessionId}_signaling`);
        const controlConn = activeConnections.get(`${sessionId}_control`);
        if (signalingConn) signalingConn.vmId = vmId;
        if (controlConn) controlConn.vmId = vmId;
      }

      const signalingUrl = `ws://${process.env.STREAMING_HOST || 'localhost'}:${WS_PORT}?sessionId=${sessionId}&type=signaling`;
      const controlUrl = `ws://${process.env.STREAMING_HOST || 'localhost'}:${WS_PORT}?sessionId=${sessionId}&type=control`;

      return reply.status(200).send(
        successResponse({
          sessionId,
          signalingUrl,
          controlUrl,
          vmId: vmId || undefined,
          // WebRTC configuration
          iceServers: [
            {
              urls: 'stun:stun.l.google.com:19302',
            },
            // TODO: Add TURN servers for production
          ],
        })
      );
    } catch (error) {
      app.log.error('Error getting stream URL:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get stream URL')
      );
    }
  }
);

// GET /api/streaming/v1/session/:sessionId/status - Get streaming status
app.get<{ Params: { sessionId: string } }>(
  '/api/streaming/v1/session/:sessionId/status',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Validate params
      const validationResult = sessionIdParamSchema.safeParse(request.params);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid session ID format',
            validationResult.error.errors
          )
        );
      }

      const { sessionId } = validationResult.data;

      // Verify session exists
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      const signalingConn = activeConnections.get(`${sessionId}_signaling`);
      const controlConn = activeConnections.get(`${sessionId}_control`);

      return reply.status(200).send(
        successResponse({
          sessionId,
          signalingConnected: !!signalingConn,
          controlConnected: !!controlConn,
          vmId: signalingConn?.vmId || controlConn?.vmId || session.vmId || null,
        })
      );
    } catch (error) {
      app.log.error('Error getting streaming status:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get streaming status')
      );
    }
  }
);

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  );
});

const PORT = parseInt(process.env.PORT || '3014', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Streaming ingest service listening on ${HOST}:${PORT}`);
  app.log.info(`WebSocket server listening on port ${WS_PORT}`);
});


import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebRTCPeer, StreamConfig } from './webrtc-peer';

// Add FFmpeg to PATH
const FFMPEG_PATH = 'C:\\ffmpeg\\bin';
process.env.PATH = `${FFMPEG_PATH};${process.env.PATH}`;

const app = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
            }
        }
    }
});

// CORS
app.register(cors, {
    origin: true
});

// Active WebRTC peers (sessionId -> WebRTCPeer)
const activePeers = new Map<string, WebRTCPeer>();

/**
 * Health check
 */
app.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        service: 'webrtc-streaming',
        transport: 'WebRTC (RTP/SRTP)',
        activeSessions: activePeers.size,
        note: 'WebSocket is used ONLY for signaling, NOT for media transport'
    };
});

/**
 * WebRTC Signaling: Create session and get offer
 * 
 * POST /webrtc/session/:sessionId/start
 * Body: { width?, height?, fps?, bitrate? }
 * 
 * Returns: { offer: any }
 */
app.post('/webrtc/session/:sessionId/start', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const config = request.body as Partial<StreamConfig>;

    app.log.info({ sessionId }, 'Starting WebRTC session');

    try {
        // Create stream config
        const streamConfig: StreamConfig = {
            width: config.width || 1920,
            height: config.height || 1080,
            fps: config.fps || 60,
            bitrate: config.bitrate || 10000,
            preset: 'ultrafast'
        };

        // Create WebRTC peer
        const peer = new WebRTCPeer(sessionId, streamConfig);

        // Handle ICE candidates
        peer.on('icecandidate', (candidate) => {
            app.log.info({ sessionId }, 'ICE candidate generated (client should poll /ice endpoint)');
            // In a real implementation, you'd send this via WebSocket or store for polling
        });

        // Handle connection state changes
        peer.on('connectionstatechange', (state) => {
            app.log.info({ sessionId, state }, 'Connection state changed');

            if (state === 'failed' || state === 'closed') {
                activePeers.delete(sessionId);
            }
        });

        // Create offer
        const offer = await peer.createOffer();

        // Store peer
        activePeers.set(sessionId, peer);

        app.log.info({ sessionId }, 'WebRTC offer created');

        return {
            success: true,
            offer: offer,
            config: streamConfig
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Failed to create WebRTC session');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * WebRTC Signaling: Handle answer from client
 * 
 * POST /webrtc/session/:sessionId/answer
 * Body: { answer: RTCSessionDescriptionInit }
 */
app.post('/webrtc/session/:sessionId/answer', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const { answer } = request.body as { answer: any };

    app.log.info({ sessionId }, 'Received WebRTC answer');

    const peer = activePeers.get(sessionId);
    if (!peer) {
        return reply.code(404).send({
            success: false,
            error: 'Session not found'
        });
    }

    try {
        await peer.handleAnswer(answer);

        app.log.info({ sessionId }, 'WebRTC answer processed, streaming should start');

        return {
            success: true,
            message: 'Answer processed, streaming started'
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Failed to process answer');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * WebRTC Signaling: Add ICE candidate
 * 
 * POST /webrtc/session/:sessionId/ice
 * Body: { candidate: RTCIceCandidateInit }
 */
app.post('/webrtc/session/:sessionId/ice', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const { candidate } = request.body as { candidate: any };

    const peer = activePeers.get(sessionId);
    if (!peer) {
        return reply.code(404).send({
            success: false,
            error: 'Session not found'
        });
    }

    try {
        await peer.addIceCandidate(candidate);

        return {
            success: true,
            message: 'ICE candidate added'
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Failed to add ICE candidate');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * Stop WebRTC session
 * 
 * POST /webrtc/session/:sessionId/stop
 */
app.post('/webrtc/session/:sessionId/stop', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    app.log.info({ sessionId }, 'Stopping WebRTC session');

    const peer = activePeers.get(sessionId);
    if (peer) {
        peer.close();
        activePeers.delete(sessionId);
    }

    return {
        success: true,
        message: 'Session stopped'
    };
});

/**
 * Get session status
 */
app.get('/webrtc/session/:sessionId/status', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const peer = activePeers.get(sessionId);
    if (!peer) {
        return {
            exists: false
        };
    }

    return {
        exists: true,
        state: peer.getState()
    };
});

/**
 * Start server
 */
async function start() {
    try {
        const port = parseInt(process.env.PORT || '3015', 10);
        const host = process.env.HOST || '0.0.0.0';

        await app.listen({ port, host });

        app.log.info(`🚀 Strike WebRTC Streaming Service`);
        app.log.info(`📡 Listening on ${host}:${port}`);
        app.log.info(`✅ Transport: WebRTC (RTP/SRTP)`);
        app.log.info(`ℹ️  WebSocket used ONLY for signaling, NOT media`);
        app.log.info(``);
        app.log.info(`Endpoints:`);
        app.log.info(`  POST /webrtc/session/:sessionId/start  - Create session & get offer`);
        app.log.info(`  POST /webrtc/session/:sessionId/answer - Send answer`);
        app.log.info(`  POST /webrtc/session/:sessionId/ice    - Add ICE candidate`);
        app.log.info(`  POST /webrtc/session/:sessionId/stop   - Stop session`);
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

start();

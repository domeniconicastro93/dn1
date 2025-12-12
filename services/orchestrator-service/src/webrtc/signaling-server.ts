import { Server as SocketIOServer } from 'socket.io';
import { FastifyInstance } from 'fastify';
import https from 'https';

interface SignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate';
    sessionId: string;
    data: any;
}

export function setupSignalingServer(fastify: FastifyInstance) {
    console.log('='.repeat(60));
    console.log('[Signaling] ========================================');
    console.log('[Signaling] INITIALIZING SOCKET.IO SERVER');
    console.log('[Signaling] ========================================');
    console.log('[Signaling] Fastify server:', !!fastify.server);
    console.log('='.repeat(60));

    const io = new SocketIOServer(fastify.server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        path: '/socket.io/'
    });

    console.log('[Signaling] Socket.IO instance created');
    console.log('[Signaling] Path: /socket.io/');
    console.log('[Signaling] CORS: enabled for all origins');

    // Store active sessions
    const sessions = new Map<string, any>();

    io.on('connection', (socket) => {
        console.log(`[Signaling] Client connected: ${socket.id}`);

        // Handle session join
        socket.on('join-session', (sessionId: string) => {
            console.log(`[Signaling] Client ${socket.id} joining session: ${sessionId}`);
            socket.join(sessionId);

            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, {
                    clients: new Set(),
                    createdAt: new Date()
                });
            }

            sessions.get(sessionId)!.clients.add(socket.id);
            console.log(`[Signaling] Session ${sessionId} now has ${sessions.get(sessionId)!.clients.size} clients`);
        });

        // Handle WebRTC offer from client
        socket.on('offer', async (message: SignalingMessage) => {
            console.log(`[Signaling] Received offer from client for session: ${message.sessionId}`);
            console.log(`[Signaling] Offer SDP type: ${message.data.type}`);

            try {
                // Forward offer to Apollo server
                const answer = await forwardOfferToApollo(message.sessionId, message.data);

                console.log(`[Signaling] Received answer from Apollo`);

                // Send answer back to client
                socket.emit('answer', {
                    type: 'answer',
                    sessionId: message.sessionId,
                    data: answer
                });

                console.log(`[Signaling] Answer sent to client`);
            } catch (error: any) {
                console.error(`[Signaling] Error forwarding offer to Apollo:`, error.message);
                socket.emit('error', {
                    message: 'Failed to connect to Apollo server',
                    error: error.message
                });
            }
        });

        // Handle ICE candidates from client
        socket.on('ice-candidate', (message: SignalingMessage) => {
            console.log(`[Signaling] Received ICE candidate from client`);
            console.log(`[Signaling] Candidate:`, message.data.candidate);

            // Forward to Apollo (if needed)
            // Apollo handles ICE internally via STUN/TURN
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[Signaling] Client disconnected: ${socket.id}`);

            // Clean up sessions
            sessions.forEach((session, sessionId) => {
                if (session.clients.has(socket.id)) {
                    session.clients.delete(socket.id);
                    console.log(`[Signaling] Removed client from session ${sessionId}`);

                    if (session.clients.size === 0) {
                        sessions.delete(sessionId);
                        console.log(`[Signaling] Session ${sessionId} removed (no clients)`);
                    }
                }
            });
        });
    });

    console.log('[Signaling] Socket.IO server initialized');

    return io;
}

/**
 * Forward WebRTC offer to Apollo server and get answer
 */
async function forwardOfferToApollo(sessionId: string, offer: any): Promise<any> {
    // Get Apollo connection details from session
    // For now, use hardcoded values (will be dynamic later)
    const apolloHost = process.env.APOLLO_HOST || '20.31.130.73';
    const apolloPort = process.env.APOLLO_PORT || '47990';

    console.log(`[Apollo] Connecting to Apollo at ${apolloHost}:${apolloPort}`);

    // Apollo WebRTC API endpoint
    const url = `https://${apolloHost}:${apolloPort}/api/webrtc/offer`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Apollo credentials (will be dynamic later)
            'Authorization': 'Basic ' + Buffer.from('apollostrike:Nosmoking93!!').toString('base64')
        },
        body: JSON.stringify({
            sdp: offer.sdp,
            type: offer.type
        }),
        // @ts-ignore - Allow self-signed certificates
        agent: new https.Agent({ rejectUnauthorized: false })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apollo API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    console.log(`[Apollo] Received answer from Apollo`);

    return {
        type: 'answer',
        // @ts-ignore
        sdp: (data as any).sdp
    };
}

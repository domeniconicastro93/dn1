// DEPRECATED: WebSocket-based streaming
// This file contains the OLD approach where video was streamed over WebSocket.
// This is kept temporarily for reference only.
// 
// ❌ DO NOT USE THIS APPROACH
// ✅ Use the new WebRTC-based streaming in webrtc-peer.ts
//
// The new architecture:
// - WebSocket is used ONLY for signaling (SDP offer/answer, ICE candidates)
// - Media (video/audio) flows over RTP/SRTP via RTCPeerConnection
//
// Date deprecated: 2025-12-11

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

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

// WebSocket
app.register(websocket);

// Active FFmpeg processes
const activeStreams = new Map<string, ChildProcess>();

/**
 * Health check
 */
app.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        service: 'webrtc-streaming',
        activeSessions: activeStreams.size,
        ffmpegAvailable: await checkFFmpeg()
    };
});

/**
 * Check if FFmpeg is available
 */
async function checkFFmpeg(): Promise<boolean> {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        ffmpeg.on('error', () => resolve(false));
        ffmpeg.on('close', (code) => resolve(code === 0));
    });
}

/**
 * WebSocket endpoint for streaming
 * 
 * ❌ DEPRECATED: This streams video over WebSocket (WRONG!)
 * ✅ Use WebRTC signaling endpoints instead
 */
app.register(async function (fastify) {
    fastify.get('/stream/:sessionId', { websocket: true }, (connection, req) => {
        const { sessionId } = req.params as { sessionId: string };

        app.log.info({ sessionId }, 'Client connected for streaming');

        // FFmpeg command to capture desktop and encode to H.264
        const ffmpeg = spawn('ffmpeg', [
            '-f', 'gdigrab',
            '-framerate', '30',
            '-i', 'desktop',
            '-vcodec', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-pix_fmt', 'yuv420p',
            '-f', 'mpegts',
            '-'
        ]);

        // Store process
        activeStreams.set(sessionId, ffmpeg);

        // Send video data to client
        ffmpeg.stdout.on('data', (chunk) => {
            try {
                connection.socket.send(chunk);
            } catch (error) {
                app.log.error({ error }, 'Error sending data to client');
            }
        });

        // Log FFmpeg errors
        ffmpeg.stderr.on('data', (data) => {
            app.log.debug({ ffmpegLog: data.toString() }, 'FFmpeg output');
        });

        // Handle FFmpeg exit
        ffmpeg.on('close', (code) => {
            app.log.info({ sessionId, code }, 'FFmpeg process closed');
            activeStreams.delete(sessionId);
        });

        // Handle client disconnect
        connection.socket.on('close', () => {
            app.log.info({ sessionId }, 'Client disconnected');
            ffmpeg.kill('SIGTERM');
            activeStreams.delete(sessionId);
        });

        // Handle errors
        connection.socket.on('error', (error) => {
            app.log.error({ sessionId, error }, 'WebSocket error');
            ffmpeg.kill('SIGTERM');
            activeStreams.delete(sessionId);
        });
    });
});

/**
 * Start server
 */
async function start() {
    try {
        // Check FFmpeg
        const ffmpegAvailable = await checkFFmpeg();
        if (!ffmpegAvailable) {
            app.log.error('FFmpeg not found! Please install FFmpeg and add to PATH.');
            app.log.error('Download: https://ffmpeg.org/download.html');
            process.exit(1);
        }

        app.log.info('✅ FFmpeg is available');

        const port = parseInt(process.env.PORT || '3015', 10);
        const host = process.env.HOST || '0.0.0.0';

        await app.listen({ port, host });

        app.log.info(`🚀 WebRTC Streaming Service listening on ${host}:${port}`);
        app.log.info(`📡 WebSocket ready at ws://${host}:${port}/stream/:sessionId`);
        app.log.info(`🎥 FFmpeg desktop capture ready`);
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

start();

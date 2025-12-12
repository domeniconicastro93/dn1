import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createMoonlightClient, MoonlightClient } from './moonlight-client';

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

// Moonlight client instance
let moonlightClient: MoonlightClient | null = null;

/**
 * Health check
 */
app.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        service: 'moonlight-wrapper',
        moonlight: {
            connected: moonlightClient?.isConnected() || false
        }
    };
});

/**
 * Connect to Apollo
 */
app.post('/api/connect', async (request, reply) => {
    const { host, port } = request.body as { host: string; port: number };

    app.log.info({ host, port }, 'Connecting to Apollo...');

    try {
        moonlightClient = createMoonlightClient({
            host: host || process.env.APOLLO_HOST || '20.31.130.73',
            port: port || parseInt(process.env.APOLLO_PORT || '47989', 10)
        });

        await moonlightClient.connect();

        return {
            success: true,
            message: 'Connected to Apollo'
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Connection failed');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * List available applications
 */
app.get('/api/apps', async (request, reply) => {
    if (!moonlightClient || !moonlightClient.isConnected()) {
        return reply.code(400).send({
            success: false,
            error: 'Not connected to Apollo. Call /api/connect first.'
        });
    }

    try {
        const apps = await moonlightClient.listApps();

        return {
            success: true,
            apps: apps
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Failed to list apps');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * Launch an application
 */
app.post('/api/launch', async (request, reply) => {
    const { appName } = request.body as { appName: string };

    if (!moonlightClient || !moonlightClient.isConnected()) {
        return reply.code(400).send({
            success: false,
            error: 'Not connected to Apollo. Call /api/connect first.'
        });
    }

    if (!appName) {
        return reply.code(400).send({
            success: false,
            error: 'appName is required'
        });
    }

    app.log.info({ appName }, 'Launching app...');

    try {
        await moonlightClient.launchApp(appName);

        return {
            success: true,
            message: `Launched ${appName}`
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Failed to launch app');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get WebRTC stream offer
 */
app.get('/api/webrtc/offer', async (request, reply) => {
    if (!moonlightClient || !moonlightClient.isConnected()) {
        return reply.code(400).send({
            success: false,
            error: 'Not connected to Apollo. Call /api/connect first.'
        });
    }

    try {
        const offer = await moonlightClient.getStreamOffer();

        return {
            success: true,
            offer: offer
        };
    } catch (error: any) {
        app.log.error({ error: error.message }, 'Failed to get stream offer');
        return reply.code(500).send({
            success: false,
            error: error.message
        });
    }
});

/**
 * Start server
 */
async function start() {
    try {
        const port = parseInt(process.env.PORT || '3013', 10);
        const host = process.env.HOST || '0.0.0.0';

        await app.listen({ port, host });

        app.log.info(`🚀 Moonlight Wrapper Service listening on ${host}:${port}`);
        app.log.info(`📡 Apollo target: ${process.env.APOLLO_HOST || '20.31.130.73'}:${process.env.APOLLO_PORT || '47989'}`);
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

start();

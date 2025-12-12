import { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import net from 'net';

export async function vncProxyRoutes(fastify: FastifyInstance) {
    console.log('[VNC Proxy] Registering WebSocket plugin...');

    // Register WebSocket plugin
    await fastify.register(fastifyWebsocket);

    console.log('[VNC Proxy] WebSocket plugin registered');

    // Register VNC proxy route
    fastify.get('/vnc/:host/:port', { websocket: true }, (connection, req) => {
        const { host, port } = req.params as { host: string; port: string };

        console.log(`[VNC Proxy] ✅ WebSocket connection established`);
        console.log(`[VNC Proxy] Target: ${host}:${port}`);

        const { socket: ws } = connection;

        // Connect to VNC server
        console.log(`[VNC Proxy] Attempting TCP connection to ${host}:${port}`);
        const vncSocket = net.connect(parseInt(port, 10), host);

        // Forward data: WebSocket -> VNC
        ws.on('message', (data: Buffer) => {
            if (vncSocket.writable) {
                vncSocket.write(data);
                console.log(`[VNC Proxy] → Sent ${data.length} bytes to VNC`);
            } else {
                console.warn(`[VNC Proxy] ⚠️ VNC socket not writable`);
            }
        });

        // Forward data: VNC -> WebSocket
        vncSocket.on('data', (data) => {
            try {
                ws.send(data);
                console.log(`[VNC Proxy] ← Received ${data.length} bytes from VNC`);
            } catch (err: any) {
                console.error(`[VNC Proxy] ❌ Error sending to WebSocket:`, err.message);
            }
        });

        // Handle VNC connection
        vncSocket.on('connect', () => {
            console.log(`[VNC Proxy] ✅ TCP connection established to ${host}:${port}`);
        });

        vncSocket.on('error', (err: any) => {
            console.error(`[VNC Proxy] ❌ VNC socket error connecting to ${host}:${port}`);
            console.error(`[VNC Proxy] Error message:`, err.message);
            console.error(`[VNC Proxy] Error code:`, err.code);
            console.error(`[VNC Proxy] Error syscall:`, err.syscall);
            ws.close();
        });

        vncSocket.on('close', () => {
            console.log(`[VNC Proxy] VNC connection closed`);
            ws.close();
        });

        vncSocket.on('timeout', () => {
            console.error(`[VNC Proxy] ❌ VNC connection timeout`);
            vncSocket.destroy();
            ws.close();
        });

        // Handle WebSocket close
        ws.on('close', () => {
            console.log(`[VNC Proxy] WebSocket closed by client`);
            vncSocket.end();
        });

        ws.on('error', (err) => {
            console.error(`[VNC Proxy] ❌ WebSocket error:`, err.message);
            vncSocket.end();
        });
    });

    fastify.log.info('VNC proxy route registered: GET /vnc/:host/:port');
}

/**
 * Strike VM Agent
 * 
 * Lightweight agent that runs on Windows VMs to:
 * - Launch Steam games
 * - Report VM health
 * - Manage game processes
 * 
 * NO Sunshine, NO Apollo, NO Parsec - self-hosted and simple.
 */

import 'dotenv/config';
import Fastify from 'fastify';
import { spawn } from 'child_process';
import os from 'os';

const app = Fastify({
    logger: {
        level: 'info',
        serializers: {
            req(req) {
                return {
                    method: req.method,
                    url: req.url,
                    // ❌ NEVER log token
                    headers: {
                        ...req.headers,
                        'x-strike-token': req.headers['x-strike-token'] ? '[REDACTED]' : undefined
                    }
                };
            }
        }
    }
});

// Configuration
const PORT = parseInt(process.env.PORT || '8787', 10);
const VM_AGENT_TOKEN = process.env.VM_AGENT_TOKEN;
const LAUNCH_TIMEOUT_MS = parseInt(process.env.LAUNCH_TIMEOUT_MS || '5000', 10);

if (!VM_AGENT_TOKEN) {
    console.error('❌ FATAL: VM_AGENT_TOKEN is required in .env');
    process.exit(1);
}

console.log('[VM Agent] Starting Strike VM Agent...');
console.log('[VM Agent] Port:', PORT);
console.log('[VM Agent] Hostname:', os.hostname());
console.log('[VM Agent] Token:', VM_AGENT_TOKEN.substring(0, 8) + '...');

/**
 * Authentication middleware
 */
async function authenticateToken(request: any, reply: any) {
    const token = request.headers['x-strike-token'];

    if (!token || token !== VM_AGENT_TOKEN) {
        app.log.warn({ ip: request.ip }, 'Authentication failed: invalid or missing token');
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
    }
}

/**
 * GET /health
 * Returns VM health information
 */
app.get('/health', async (request, reply) => {
    const uptime = Math.floor(process.uptime());

    const health = {
        ok: true,
        hostname: os.hostname(),
        user: os.userInfo().username,
        uptime,
        time: new Date().toISOString(),
        platform: os.platform(),
        release: os.release()
    };

    app.log.info('Health check requested');
    return reply.send(health);
});

/**
 * POST /launch
 * Launches a Steam game
 * 
 * Body: { steamAppId: string | number }
 * Header: X-Strike-Token: <token>
 */
app.post<{ Body: { steamAppId: string | number } }>(
    '/launch',
    { preHandler: authenticateToken },
    async (request, reply) => {
        const { steamAppId } = request.body;

        if (!steamAppId) {
            app.log.error('Launch request missing steamAppId');
            return reply.status(400).send({ ok: false, error: 'steamAppId is required' });
        }

        app.log.info({ steamAppId }, 'Launching Steam game');

        try {
            // Use PowerShell to launch Steam game
            const steamUrl = `steam://rungameid/${steamAppId}`;
            const command = `Start-Process "${steamUrl}"`;

            app.log.info({ command }, 'Executing PowerShell command');

            const result = await launchSteamGame(command);

            if (result.success) {
                app.log.info({ steamAppId }, '✅ Steam game launched successfully');
                return reply.send({ ok: true, steamAppId: Number(steamAppId) });
            } else {
                app.log.error({ steamAppId, error: result.error }, '❌ Failed to launch Steam game');
                return reply.status(500).send({ ok: false, error: result.error });
            }
        } catch (error: any) {
            app.log.error({ steamAppId, error: error.message }, '❌ Exception launching Steam game');
            return reply.status(500).send({ ok: false, error: error.message });
        }
    }
);

/**
 * POST /focus
 * Brings game window to foreground (stub for later)
 */
app.post(
    '/focus',
    { preHandler: authenticateToken },
    async (request, reply) => {
        app.log.info('Focus requested (not implemented)');
        return reply.status(501).send({ ok: false, error: 'Not implemented yet' });
    }
);

/**
 * POST /kill
 * Terminates game process (stub for later)
 */
app.post<{ Body: { steamAppId?: string | number; processName?: string } }>(
    '/kill',
    { preHandler: authenticateToken },
    async (request, reply) => {
        const { steamAppId, processName } = request.body;
        app.log.info({ steamAppId, processName }, 'Kill requested (not implemented)');
        return reply.status(501).send({ ok: false, error: 'Not implemented yet' });
    }
);

/**
 * Launch Steam game using PowerShell
 * Windows-specific implementation
 */
function launchSteamGame(command: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        const child = spawn('powershell.exe', [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            command
        ], {
            timeout: LAUNCH_TIMEOUT_MS,
            windowsHide: true
        });

        let stderr = '';

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });

        child.on('exit', (code) => {
            if (code === 0) {
                resolve({ success: true });
            } else {
                resolve({
                    success: false,
                    error: `PowerShell exit code ${code}${stderr ? ': ' + stderr : ''}`
                });
            }
        });

        // Timeout fallback
        setTimeout(() => {
            if (!child.killed) {
                child.kill();
                resolve({ success: false, error: 'Launch timeout exceeded' });
            }
        }, LAUNCH_TIMEOUT_MS);
    });
}

/**
 * Start server
 */
async function start() {
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`[VM Agent] ✅ Server listening on http://0.0.0.0:${PORT}`);
        console.log('[VM Agent] Ready to receive launch requests');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();

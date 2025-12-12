import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
} from '@strike/shared-utils';
import type {
  CreateVMRequestDTO,
  CreateVMResponseDTO,
  AssignSessionToVMRequestDTO,
  VMDTO,
} from '@strike/shared-types';
import {
  createVM,
  markVMReady,
  assignSessionToVM,
  releaseSessionFromVM,
  markVMDraining,
  handleVMError,
  terminateVM,
  getVM,
  initializeTemplates,
  getAllTemplates,
} from './vm-lifecycle';
import { findVMWithFallback, getRegionCapacity, getAllRegionCapacities } from './region-fallback';
import { getGameStreamingSettings, selectVMTemplateForGame } from './game-presets';
import {
  assignSessionToVMWithCapacity,
  releaseSessionFromVMWithCleanup,
  getVMSessions,
  getVMCapacityMetrics,
  canVMAcceptSessions,
  getAvailableVMsForSessions,
} from './session-orchestration';
import {
  emitVMProvisioned,
  emitVMReady,
  emitVMError,
  emitVMPoolLowCapacity,
  emitVMTerminated,
  emitSessionAssigned,
  emitSessionReleased,
} from './events';
import { getOrchestratorMetrics } from './metrics';
import { prisma } from '@strike/shared-db';
import { getSunshineClient, createSunshineClient, SunshineConnectionError, type SunshineApplication } from './sunshine-client';
import { mapSteamToSunshine } from './sunshine-mapper';
import { checkSunshineHealth } from './sunshine-health';
import type { SteamLibraryResponseDTO, SteamInstalledGameDTO } from '@strike/shared-types';
import { getSunshinePairingClient } from './core/sunshine-pairing-client';
import { getWebRTCClient } from './core/webrtc-client';
import { getVMAgentClient } from './core/vm-agent-client';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors as any, {
  origin: true,
  credentials: true,
});

import { startHealthMonitoring } from './health-monitor';
import { registerSessionRoutes } from './routes/session';
import { vncProxyRoutes } from './routes/vnc-proxy';
import { setupSignalingServer } from './webrtc/signaling-server';



const start = async () => {
  try {
    // Initialize templates on startup
    await initializeTemplates();

    // Start health monitoring
    startHealthMonitoring();

    // GLOBAL REQUEST LOGGER - Catches ALL requests before route handlers
    app.addHook('onRequest', async (request, reply) => {
      console.log('[ORCHESTRATOR] ========================================');
      console.log('[ORCHESTRATOR] Incoming Request');
      console.log('[ORCHESTRATOR] Method:', request.method);
      console.log('[ORCHESTRATOR] URL:', request.url);
      console.log('[ORCHESTRATOR] Headers:', JSON.stringify(request.headers, null, 2));
      console.log('[ORCHESTRATOR] ========================================');
    });

    // GLOBAL ERROR HANDLER - Catches ALL errors
    app.setErrorHandler((error, request, reply) => {
      console.error('[ORCHESTRATOR] ========================================');
      console.error('[ORCHESTRATOR] ERROR CAUGHT');
      console.error('[ORCHESTRATOR] URL:', request.url);
      console.error('[ORCHESTRATOR] Error:', error);
      console.error('[ORCHESTRATOR] Stack:', error.stack);
      console.error('[ORCHESTRATOR] ========================================');

      reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
          details: error.stack,
        },
      });
    });

    // SIMPLE TEST ENDPOINT - Verify Orchestrator is reachable
    app.get('/api/orchestrator/v1/test', async (request, reply) => {
      console.log('[ORCHESTRATOR] TEST ENDPOINT HIT!');
      return reply.status(200).send({
        success: true,
        message: 'Orchestrator is reachable!',
        timestamp: new Date().toISOString(),
      });
    });

    // Debug endpoint for environment variables
    app.get('/test/env', async (request, reply) => {
      return reply.status(200).send({
        SUNSHINE_URL: process.env.SUNSHINE_URL,
        SUNSHINE_PORT: process.env.SUNSHINE_PORT,
        SUNSHINE_USE_HTTPS: process.env.SUNSHINE_USE_HTTPS,
        SUNSHINE_VERIFY_SSL: process.env.SUNSHINE_VERIFY_SSL,
        SUNSHINE_TIMEOUT: process.env.SUNSHINE_TIMEOUT,
        SUNSHINE_USERNAME: process.env.SUNSHINE_USERNAME,
        SUNSHINE_PASSWORD: process.env.SUNSHINE_PASSWORD ? '***' : undefined,
        ORCHESTRATOR_SUNSHINE_HOST: process.env.ORCHESTRATOR_SUNSHINE_HOST,
        ORCHESTRATOR_SUNSHINE_PORT: process.env.ORCHESTRATOR_SUNSHINE_PORT,
        ORCHESTRATOR_SUNSHINE_USE_HTTPS: process.env.ORCHESTRATOR_SUNSHINE_USE_HTTPS,
      });
    });

    // Test endpoint for Sunshine connectivity
    app.get('/test/sunshine', async (request, reply) => {
      try {
        const sunshineHost = process.env.SUNSHINE_URL || process.env.ORCHESTRATOR_SUNSHINE_HOST || '20.31.130.73';
        const sunshinePort = parseInt(process.env.SUNSHINE_PORT || process.env.ORCHESTRATOR_SUNSHINE_PORT || '47990', 10);
        const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true' || process.env.ORCHESTRATOR_SUNSHINE_USE_HTTPS === 'true';
        const verifySsl = process.env.SUNSHINE_VERIFY_SSL !== 'false';
        const timeout = parseInt(process.env.SUNSHINE_TIMEOUT || '300000', 10);

        app.log.info(`[TEST] Testing Sunshine connection to ${sunshineHost}:${sunshinePort} (timeout: ${timeout}ms)`);

        const sunshineClient = createSunshineClient({
          url: sunshineHost,
          port: sunshinePort,
          username: process.env.SUNSHINE_USERNAME || 'strike',
          password: process.env.SUNSHINE_PASSWORD || '',
          useHttps,
          verifySsl,
          timeout,
        });

        app.log.info(`[TEST] Sunshine client config: url=${sunshineHost}, port=${sunshinePort}, useHttps=${useHttps}, timeout=${timeout}ms`);

        const connectionTest = await sunshineClient.testConnection();

        if (connectionTest.connected) {
          app.log.info('[TEST] Sunshine connection successful!');
          return reply.status(200).send(successResponse({
            connected: true,
            host: sunshineHost,
            port: sunshinePort,
            message: 'Sunshine is reachable',
          }));
        } else {
          // @ts-ignore
          app.log.error('[TEST] Sunshine connection failed:', connectionTest.error);
          return reply.status(500).send(errorResponse(
            ErrorCodes.INTERNAL_ERROR,
            'Sunshine connection failed',
            { error: connectionTest.error }
          ));
        }
      } catch (error) {
        // @ts-ignore
        app.log.error('[TEST] Exception testing Sunshine:', error);
        return reply.status(500).send(errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Error testing Sunshine connection',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        ));
      }
    });

    // Test endpoint for Sunshine pairing (NEW - Phase 11 Pairing Protocol)
    app.get('/test/sunshine/pairing', async (request, reply) => {
      try {
        const sunshineHost = process.env.SUNSHINE_URL || process.env.ORCHESTRATOR_SUNSHINE_HOST || '20.31.130.73';
        const sunshinePort = parseInt(process.env.SUNSHINE_PORT || process.env.ORCHESTRATOR_SUNSHINE_PORT || '47985', 10);
        const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true' || process.env.ORCHESTRATOR_SUNSHINE_USE_HTTPS === 'true';
        const verifySsl = process.env.SUNSHINE_VERIFY_SSL !== 'false';

        app.log.info(`[TEST PAIRING] Testing Sunshine pairing to ${sunshineHost}:${sunshinePort}`);

        const pairingClient = getSunshinePairingClient({
          host: sunshineHost,
          port: sunshinePort,
          useHttps,
          verifySsl,
        });

        // Attempt pairing
        const pairingResult = await pairingClient.pair();

        if (pairingResult.success) {
          app.log.info('[TEST PAIRING] Pairing successful!');
          return reply.status(200).send(successResponse({
            success: true,
            sessionKey: pairingResult.sessionKey,
            pin: pairingResult.pin,
            message: 'Sunshine pairing successful',
          }));
        } else {
          // @ts-ignore
          app.log.error('[TEST PAIRING] Pairing failed:', pairingResult.error);
          return reply.status(500).send(errorResponse(
            ErrorCodes.INTERNAL_ERROR,
            'Sunshine pairing failed',
            { error: pairingResult.error, pin: pairingResult.pin }
          ));
        }
      } catch (error) {
        // @ts-ignore
        app.log.error('[TEST PAIRING] Exception during pairing:', error);
        return reply.status(500).send(errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Error testing Sunshine pairing',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        ));
      }
    });

    // Test endpoint for launching game with Basic Auth (NEW - Simplified Approach)
    app.get('/test/sunshine/launch', async (request, reply) => {
      try {
        const sunshineHost = process.env.SUNSHINE_URL || '20.31.130.73';
        const sunshinePort = parseInt(process.env.SUNSHINE_PORT || '47990', 10);
        const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true';
        const username = process.env.SUNSHINE_USERNAME || 'strike';
        const password = process.env.SUNSHINE_PASSWORD || '';

        app.log.info(`[TEST LAUNCH] Testing game launch to ${sunshineHost}:${sunshinePort}`);

        // Use the first available app (index 0)
        const appIndex = 0;

        return new Promise((resolve, reject) => {
          const https = require('https');
          const http = require('http');
          const httpModule = useHttps ? https : http;

          const credentials = Buffer.from(`${username}:${password}`).toString('base64');
          const postData = JSON.stringify({ index: appIndex });

          const options = {
            hostname: sunshineHost,
            port: sunshinePort,
            path: '/api/launch',
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
            rejectUnauthorized: false,
            timeout: 30000,
          };

          const req = httpModule.request(options, (res: any) => {
            let data = '';

            res.on('data', (chunk: any) => {
              data += chunk;
            });

            res.on('end', () => {
              app.log.info(`[TEST LAUNCH] Response status: ${res.statusCode}`);
              app.log.info(`[TEST LAUNCH] Response body: ${data}`);

              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                app.log.info('[TEST LAUNCH] Launch successful!');
                resolve(reply.status(200).send(successResponse({
                  success: true,
                  appIndex,
                  response: data,
                  message: 'Game launch successful',
                })));
              } else {
                // @ts-ignore
                app.log.error('[TEST LAUNCH] Launch failed:', data);
                resolve(reply.status(500).send(errorResponse(
                  ErrorCodes.INTERNAL_ERROR,
                  'Game launch failed',
                  { status: res.statusCode, response: data }
                )));
              }
            });
          });

          req.on('error', (error: Error) => {
            // @ts-ignore
            app.log.error('[TEST LAUNCH] Exception during launch:', error);
            resolve(reply.status(500).send(errorResponse(
              ErrorCodes.INTERNAL_ERROR,
              'Error testing game launch',
              { error: error.message }
            )));
          });

          req.on('timeout', () => {
            req.destroy();
            app.log.error('[TEST LAUNCH] Request timed out');
            resolve(reply.status(500).send(errorResponse(
              ErrorCodes.INTERNAL_ERROR,
              'Game launch request timed out',
              { timeout: 30000 }
            )));
          });

          req.write(postData);
          req.end();
        });
      } catch (error) {
        // @ts-ignore
        app.log.error('[TEST LAUNCH] Exception during launch:', error);
        return reply.status(500).send(errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Error testing game launch',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        ));
      }
    });

    // Test endpoint for trying multiple Sunshine API formats (NEW - Auto-Discovery)
    app.get('/test/sunshine/formats', async (request, reply) => {
      try {
        const sunshineHost = process.env.SUNSHINE_URL || '20.31.130.73';
        const sunshinePort = parseInt(process.env.SUNSHINE_PORT || '47985', 10);
        const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true';
        const username = process.env.SUNSHINE_USERNAME || 'strike';
        const password = process.env.SUNSHINE_PASSWORD || '';

        app.log.info(`[TEST FORMATS] Testing multiple Sunshine API formats`);

        const protocol = useHttps ? 'https' : 'http';
        const baseUrl = `${protocol}://${sunshineHost}:${sunshinePort}`;
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');

        const https = await import('https');
        const httpsAgent = useHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined;

        const results: any[] = [];

        // Test 1: Get available apps
        try {
          const appsResponse = await fetch(`${baseUrl}/api/apps`, {
            headers: { 'Authorization': `Basic ${credentials}` },
            ...(httpsAgent && { agent: httpsAgent }),
          });
          const apps = await appsResponse.json();
          results.push({ test: 'GET /api/apps', status: appsResponse.status, data: apps });
        } catch (e) {
          results.push({ test: 'GET /api/apps', error: e instanceof Error ? e.message : 'Unknown' });
        }

        // Test 2: Launch with index
        try {
          const response = await fetch(`${baseUrl}/api/launch`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index: 0 }),
            ...(httpsAgent && { agent: httpsAgent }),
          });
          const data = await response.text();
          results.push({ test: 'POST /api/launch (index: 0)', status: response.status, data });
        } catch (e) {
          results.push({ test: 'POST /api/launch (index: 0)', error: e instanceof Error ? e.message : 'Unknown' });
        }

        // Test 3: Launch with id
        try {
          const response = await fetch(`${baseUrl}/api/launch`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: 0 }),
            ...(httpsAgent && { agent: httpsAgent }),
          });
          const data = await response.text();
          results.push({ test: 'POST /api/launch (id: 0)', status: response.status, data });
        } catch (e) {
          results.push({ test: 'POST /api/launch (id: 0)', error: e instanceof Error ? e.message : 'Unknown' });
        }

        // Test 4: Launch app by index endpoint
        try {
          const response = await fetch(`${baseUrl}/api/apps/0/launch`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${credentials}` },
            ...(httpsAgent && { agent: httpsAgent }),
          });
          const data = await response.text();
          results.push({ test: 'POST /api/apps/0/launch', status: response.status, data });
        } catch (e) {
          results.push({ test: 'POST /api/apps/0/launch', error: e instanceof Error ? e.message : 'Unknown' });
        }

        app.log.info('[TEST FORMATS] All tests completed');
        return reply.status(200).send(successResponse({
          message: 'Tested multiple Sunshine API formats',
          results,
        }));
      } catch (error) {
        // @ts-ignore
        app.log.error('[TEST FORMATS] Exception:', error);
        return reply.status(500).send(errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Error testing Sunshine formats',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        ));
      }
    });

    // Register session routes
    registerSessionRoutes(app);
    app.log.info('Session routes registered');

    // Register VNC proxy routes (DISABLED - using Apollo + WebRTC instead)
    // await vncProxyRoutes(app);
    // app.log.info('VNC proxy routes registered');
    console.log('[ORCHESTRATOR] VNC proxy disabled - using Apollo + WebRTC');

    // Setup WebRTC signaling server
    setupSignalingServer(app);
    app.log.info('WebRTC signaling server initialized');

    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Orchestrator service listening on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};


start();

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'orchestrator-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `orchestrator:${clientId}`,
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

// POST /api/orchestrator/v1/vm - Create VM
app.post<{ Body: CreateVMRequestDTO }>(
  '/api/orchestrator/v1/vm',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { templateId, region } = request.body;

    if (!templateId || !region) {
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'templateId and region are required'
        )
      );
    }

    try {
      const vm = await createVM(templateId, region);
      emitVMProvisioned(vm.id, templateId, region);

      const response: CreateVMResponseDTO = {
        vmId: vm.id,
        status: vm.status.toLowerCase() as 'provisioning' | 'booting' | 'ready' | 'error',
      };

      return reply.status(202).send(successResponse(response));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          error instanceof Error ? error.message : 'Failed to create VM'
        )
      );
    }
  }
);

// POST /api/orchestrator/v1/vm/assign - Assign session to VM
app.post<{ Body: AssignSessionToVMRequestDTO }>(
  '/api/orchestrator/v1/vm/assign',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { sessionId, vmId } = request.body;

    if (!sessionId || !vmId) {
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'sessionId and vmId are required'
        )
      );
    }

    try {
      const vm = await assignSessionToVM(vmId, sessionId);
      if (!vm) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
        );
      }

      emitSessionAssigned(vmId, sessionId);

      return reply.status(200).send(successResponse({ success: true, vm }));
    } catch (error) {
      app.log.error(error);
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          error instanceof Error ? error.message : 'Failed to assign session'
        )
      );
    }
  }
);

// GET /api/orchestrator/v1/vm/:vmId
app.get<{ Params: { vmId: string } }>(
  '/api/orchestrator/v1/vm/:vmId',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;

    // Get VM from database
    const vm = await getVM(vmId);

    if (!vm) {
      return reply.status(404).send(
        errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
      );
    }

    const vmDTO: VMDTO = {
      id: vm.id,
      templateId: vm.templateId,
      region: vm.region,
      status: vm.status.toLowerCase() as any,
      currentSessions: vm.currentSessions,
      maxSessions: vm.maxSessions,
      createdAt: vm.createdAt.toISOString(),
      updatedAt: vm.updatedAt.toISOString(),
    };

    return reply.status(200).send(successResponse(vmDTO));
  }
);

// POST /api/orchestrator/v1/vm/:vmId/ready - Mark VM as ready
app.post<{ Params: { vmId: string } }>(
  '/api/orchestrator/v1/vm/:vmId/ready',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;

    try {
      const vm = await markVMReady(vmId);
      if (!vm) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
        );
      }

      emitVMReady(vmId);

      return reply.status(200).send(successResponse({ success: true, vm }));
    } catch (error) {
      app.log.error(error);
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          error instanceof Error ? error.message : 'Failed to mark VM ready'
        )
      );
    }
  }
);

// POST /api/orchestrator/v1/vm/:vmId/draining - Mark VM as draining
app.post<{ Params: { vmId: string } }>(
  '/api/orchestrator/v1/vm/:vmId/draining',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;

    try {
      const vm = await markVMDraining(vmId);
      if (!vm) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
        );
      }

      return reply.status(200).send(successResponse({ success: true, vm }));
    } catch (error) {
      app.log.error(error);
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          error instanceof Error ? error.message : 'Failed to mark VM draining'
        )
      );
    }
  }
);

// POST /api/orchestrator/v1/vm/:vmId/error - Handle VM error
app.post<{
  Params: { vmId: string };
  Body: { errorCode: string; errorMessage: string };
}>(
  '/api/orchestrator/v1/vm/:vmId/error',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;
    const { errorCode, errorMessage } = request.body;

    if (!errorCode || !errorMessage) {
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'errorCode and errorMessage are required'
        )
      );
    }

    try {
      const vm = await handleVMError(vmId, errorCode, errorMessage);
      if (!vm) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
        );
      }

      // handleVMError already emits the event internally
      return reply.status(200).send(successResponse({ success: true, vm }));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to handle VM error')
      );
    }
  }
);

// POST /api/orchestrator/v1/vm/:vmId/terminate - Terminate VM
app.post<{ Params: { vmId: string }; Body?: { reason?: string } }>(
  '/api/orchestrator/v1/vm/:vmId/terminate',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;
    const { reason } = request.body || {};

    try {
      const vm = await terminateVM(vmId, reason);
      if (!vm) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
        );
      }

      emitVMTerminated(vmId, reason);

      return reply.status(200).send(successResponse({ success: true, vm }));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to terminate VM')
      );
    }
  }
);

// POST /api/orchestrator/v1/vm/:vmId/release - Release session from VM
app.post<{ Params: { vmId: string }; Body: { sessionId: string } }>(
  '/api/orchestrator/v1/vm/:vmId/release',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;
    const { sessionId } = request.body;

    if (!sessionId) {
      return reply.status(400).send(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'sessionId is required')
      );
    }

    try {
      const result = await releaseSessionFromVMWithCleanup(sessionId, vmId);
      if (!result.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            result.error || 'Failed to release session'
          )
        );
      }

      const vm = await getVM(vmId);
      return reply.status(200).send(successResponse({ success: true, vm }));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to release session')
      );
    }
  }
);

// GET /api/orchestrator/v1/regions/:region/capacity - Get region capacity
app.get<{ Params: { region: string } }>(
  '/api/orchestrator/v1/regions/:region/capacity',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { region } = request.params;

    const capacity = await getRegionCapacity(region);

    return reply.status(200).send(successResponse(capacity));
  }
);

// GET /api/orchestrator/v1/regions/capacity - Get all region capacities
app.get(
  '/api/orchestrator/v1/regions/capacity',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const capacities = await getAllRegionCapacities();

    return reply.status(200).send(successResponse(capacities));
  }
);

// GET /api/orchestrator/v1/metrics - Get orchestrator metrics
app.get(
  '/api/orchestrator/v1/metrics',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const metrics = await getOrchestratorMetrics();

    return reply.status(200).send(successResponse(metrics));
  }
);

// POST /api/orchestrator/v1/find-vm - Find available VM with fallback
app.post<{
  Body: { region: string; gameId?: string; maxSessions?: number };
}>(
  '/api/orchestrator/v1/find-vm',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { region, gameId, maxSessions = 1 } = request.body;

    if (!region) {
      return reply.status(400).send(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'region is required')
      );
    }

    try {
      const result = await findVMWithFallback(region, maxSessions);

      if (!result) {
        // Check if we should create a new VM
        const capacity = await getRegionCapacity(region);
        if (capacity.availableVMs === 0 && capacity.vmsInProvisioning === 0) {
          // No capacity, suggest creating a new VM
          // For Phase 5, we return null and let the caller decide
          return reply.status(404).send(
            errorResponse(
              ErrorCodes.NOT_FOUND,
              'No available VM in region. Consider creating a new VM.'
            )
          );
        }

        return reply.status(202).send(
          successResponse({
            message: 'No immediate capacity, but VMs are provisioning',
            capacity,
          })
        );
      }

      return reply.status(200).send(successResponse(result));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to find VM')
      );
    }
  }
);

// GET /api/orchestrator/v1/vm/:vmId/sessions - Get sessions assigned to VM
app.get<{ Params: { vmId: string } }>(
  '/api/orchestrator/v1/vm/:vmId/sessions',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;

    try {
      const sessions = await getVMSessions(vmId);
      return reply.status(200).send(successResponse(sessions));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get VM sessions')
      );
    }
  }
);

// GET /api/orchestrator/v1/vm/:vmId/capacity - Get VM capacity metrics
app.get<{ Params: { vmId: string } }>(
  '/api/orchestrator/v1/vm/:vmId/capacity',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;

    try {
      const metrics = await getVMCapacityMetrics(vmId);
      return reply.status(200).send(successResponse(metrics));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get VM capacity')
      );
    }
  }
);

// GET /api/orchestrator/v1/regions/:region/available-vms - Get available VMs for sessions
app.get<{
  Params: { region: string };
  Querystring: { requestedSessions?: string };
}>(
  '/api/orchestrator/v1/regions/:region/available-vms',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { region } = request.params;
    const requestedSessions = parseInt(request.query.requestedSessions || '1', 10);

    try {
      const availableVMs = await getAvailableVMsForSessions(region, requestedSessions);
      return reply.status(200).send(successResponse(availableVMs));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get available VMs')
      );
    }
  }
);

// POST /api/orchestrator/v1/vm/heartbeat - VM heartbeat (from VM agent)
// Master Prompt Section 7: "POST /internal/orchestrator/vm/heartbeat - From VM agent, to keep session alive"
app.post<{
  Params: { vmId: string };
  Body: { sessionId?: string; healthStatus?: string };
}>(
  '/api/orchestrator/v1/vm/:vmId/heartbeat',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { vmId } = request.params;
    const { sessionId, healthStatus } = request.body;

    try {
      const vm = await getVM(vmId);
      if (!vm) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'VM not found')
        );
      }

      // Update VM last heartbeat timestamp
      await prisma.vM.update({
        where: { id: vmId },
        data: { lastHeartbeat: new Date() },
      });

      // If healthStatus indicates issues, handle accordingly
      if (healthStatus === 'unhealthy' || healthStatus === 'error') {
        await handleVMError(vmId, 'HEARTBEAT_UNHEALTHY', 'VM reported unhealthy status');
      }

      // If VM is in ERROR state but heartbeat is healthy, attempt recovery
      if (vm.status === 'ERROR' && healthStatus === 'healthy') {
        // Could transition back to READY if appropriate
        // For now, we just log it
        app.log.info(`VM ${vmId} is healthy but in ERROR state - may need manual intervention`);
      }

      return reply.status(200).send(
        successResponse({
          success: true,
          vmId,
          sessionId,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      app.log.error({ err: error }, 'Error processing heartbeat');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to process heartbeat')
      );
    }
  }
);

// POST /api/orchestrator/v1/sessions - Request a new cloud gaming session
// Master Prompt Section 7: "POST /internal/orchestrator/sessions - Request a new cloud gaming session"
app.post<{
  Body: { userId: string; gameId: string; region: string; deviceInfo?: any };
}>(
  '/api/orchestrator/v1/sessions',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { userId, gameId, region, deviceInfo } = request.body;

    if (!userId || !gameId || !region) {
      return reply.status(400).send(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'userId, gameId, and region are required'
        )
      );
    }

    try {
      // Get game preset to select appropriate VM template
      const templates = await getAllTemplates();
      const selectedTemplate = await selectVMTemplateForGame(gameId, templates);

      if (!selectedTemplate) {
        return reply.status(503).send(
          errorResponse(
            ErrorCodes.INTERNAL_ERROR,
            'No suitable VM template available for this game'
          )
        );
      }

      // Find available VM with fallback
      const vmResult = await findVMWithFallback(region, 1);

      if (!vmResult) {
        // Create new VM if no capacity
        const newVM = await createVM(selectedTemplate, region);
        return reply.status(202).send(
          successResponse({
            sessionId: null, // Will be created by session-service
            vmId: newVM.id,
            status: 'provisioning',
            message: 'VM is being provisioned',
          })
        );
      }

      // Assign session to VM
      // Note: Actual session creation is done by session-service
      // This endpoint just finds/allocates the VM
      return reply.status(200).send(
        successResponse({
          vmId: vmResult.vmId,
          region: vmResult.region,
          status: 'ready',
        })
      );
    } catch (error) {
      app.log.error({ err: error }, 'Error requesting session');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to request session')
      );
    }
  }
);

// DELETE /api/orchestrator/v1/sessions/:id - Terminate a session
// Master Prompt Section 7: "DELETE /internal/orchestrator/sessions/:id - Terminate a session"
app.delete<{ Params: { id: string } }>(
  '/api/orchestrator/v1/sessions/:id',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { id: sessionId } = request.params;

    try {
      // Get session to find VM
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
      }

      if (session.vmId) {
        // Release session from VM
        const result = await releaseSessionFromVMWithCleanup(sessionId, session.vmId);
        if (!result.success) {
          return reply.status(400).send(
            errorResponse(
              ErrorCodes.VALIDATION_ERROR,
              result.error || 'Failed to release session'
            )
          );
        }
      }

      return reply.status(200).send(
        successResponse({
          success: true,
          sessionId,
          message: 'Session terminated',
        })
      );
    } catch (error) {
      app.log.error({ err: error }, 'Error terminating session');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to terminate session')
      );
    }
  }
);

// POST /api/orchestrator/v1/start-session - Direct session start (Task 1441)
app.post<{ Body: { userId: string; appId: string } }>(
  '/api/orchestrator/v1/start-session',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    const { userId, appId } = request.body;
    app.log.info({ userId, appId }, 'Received start-session request');

    if (!userId || !appId) {
      return reply.status(400).send(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId and appId are required')
      );
    }

    try {
      // Mock/Minimal implementation as requested
      const host = process.env.ORCHESTRATOR_SUNSHINE_HOST || '20.31.130.73';
      const port = parseInt(process.env.ORCHESTRATOR_SUNSHINE_PORT || '47984', 10);
      const useHttps = process.env.ORCHESTRATOR_SUNSHINE_USE_HTTPS === 'true';

      // In a real implementation, we would map appId to a Sunshine app ID
      // For now, we pass it through or use a default
      const sunshineAppId = appId;

      const session = {
        host,
        port,
        udpPorts: [47993, 47994, 47995], // Standard Sunshine ports
        appId: sunshineAppId,
        protocol: 'sunshine-moonlight',
        useHttps,
      };

      app.log.info({ session }, 'Session started successfully');

      return reply.status(200).send(successResponse({
        success: true,
        session
      }));
    } catch (error) {
      app.log.error({ err: error }, 'Error starting session');
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to start session')
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

// GET /api/orchestrator/v1/compute/applications - Get Sunshine applications with Steam mappings
app.get(
  '/api/orchestrator/v1/compute/applications',
  {
    preHandler: [rateLimitMiddleware as any],
  },
  async (request, reply) => {
    try {
      const STEAM_LIBRARY_SERVICE_URL = process.env.STEAM_LIBRARY_SERVICE_URL || 'http://localhost:3022';

      // Fetch Steam games from steam-library-service
      let steamGames: SteamInstalledGameDTO[] = [];
      let steamLibrary: SteamLibraryResponseDTO | null = null;

      try {
        const steamResponse = await fetch(`${STEAM_LIBRARY_SERVICE_URL}/api/games/installed`, {
          cache: 'no-store',
        } as any);

        if (steamResponse.ok) {
          const steamData = await steamResponse.json() as any;
          steamLibrary = (steamData?.data ?? steamData) as SteamLibraryResponseDTO;
          steamGames = steamLibrary?.games || [];
        } else {
          app.log.warn('Failed to fetch Steam games, continuing without Steam data');
        }
      } catch (error) {
        app.log.warn({ err: error }, 'Error fetching Steam games');
        // Continue without Steam games
      }

      // Fetch Sunshine applications
      let sunshineApps: SunshineApplication[] = [];
      let sunshineConnected = false;

      try {
        const sunshineClient = getSunshineClient();
        sunshineApps = await sunshineClient.getApplications();
        sunshineConnected = true;
      } catch (error) {
        if (error instanceof SunshineConnectionError) {
          app.log.warn({ msg: error.message }, 'Sunshine not available');
        } else {
          app.log.warn({ err: error }, 'Error fetching Sunshine applications');
        }
        // Continue without Sunshine apps
      }

      // Map Steam games to Sunshine applications
      let mappings: Array<{
        appId: string;
        sunshineAppId?: string;
        title: string;
        status: string;
        steamAppId?: string;
        executablePath?: string;
        description?: string;
        genres?: string[];
        lastUpdated?: string;
      }> = [];

      if (sunshineConnected && sunshineApps.length > 0 && steamGames.length > 0) {
        const mappingResult = await mapSteamToSunshine(steamGames, sunshineApps);

        // Create combined list with mappings
        for (const mapping of mappingResult.mappings) {
          const steamGame = steamGames.find((g) => g.appId === mapping.steamAppId);
          mappings.push({
            appId: mapping.sunshineAppId,
            sunshineAppId: mapping.sunshineAppId,
            steamAppId: mapping.steamAppId,
            title: mapping.title,
            status: steamGame?.status || 'installed',
            executablePath: mapping.executablePath,
            description: steamGame?.metadata?.description,
            genres: steamGame?.metadata?.genres,
            lastUpdated: steamGame?.lastUpdated || steamGame?.metadata?.lastUpdated,
          });
        }

        // Add unmapped Steam games (without sunshineAppId)
        for (const game of mappingResult.unmappedSteamGames) {
          mappings.push({
            appId: game.appId,
            steamAppId: game.appId,
            title: game.title,
            status: game.status,
            executablePath: game.executablePath,
            description: game.metadata?.description,
            genres: game.metadata?.genres,
            lastUpdated: game.lastUpdated || game.metadata?.lastUpdated,
          });
        }
      } else {
        // No Sunshine or no mapping possible, return Steam games only
        for (const game of steamGames) {
          mappings.push({
            appId: game.appId,
            steamAppId: game.appId,
            title: game.title,
            status: game.status,
            executablePath: game.executablePath,
            description: game.metadata?.description,
            genres: game.metadata?.genres,
            lastUpdated: game.lastUpdated || game.metadata?.lastUpdated,
          });
        }
      }

      // Build response
      const response = {
        vmId: steamLibrary?.vmId || 'vm-default',
        vmName: steamLibrary?.vmName || 'Strike Compute VM',
        region: steamLibrary?.region || 'us-east-1',
        status: sunshineConnected ? 'online' : steamLibrary?.status || 'unknown',
        lastSyncedAt: steamLibrary?.lastSyncedAt || new Date().toISOString(),
        applications: mappings,
        sunshineConnected,
        steamGamesCount: steamGames.length,
        sunshineAppsCount: sunshineApps.length,
        mappedCount: mappings.filter((m) => m.sunshineAppId).length,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error({ err: error }, 'Error fetching compute applications');
      return reply.status(500).send(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch compute applications'
        )
      );
    }
  }
);

// GET /api/orchestrator/v1/compute/status - Get compute/VM status including Sunshine health
app.get(
  '/api/orchestrator/v1/compute/status',
  {
    preHandler: [rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      // Check Sunshine health
      const sunshineHealth = await checkSunshineHealth();

      // Get orchestrator metrics
      const metrics = await getOrchestratorMetrics();

      const response = {
        status: sunshineHealth.connected ? 'online' : 'offline',
        vmId: 'vm-default', // Could be enhanced to get actual VM ID
        vmName: 'Strike Compute VM',
        region: 'us-east-1', // Could be enhanced to get actual region
        updatedAt: new Date().toISOString(),
        sunshine: {
          connected: sunshineHealth.connected,
          url: sunshineHealth.url,
          port: sunshineHealth.port,
          useHttps: sunshineHealth.useHttps,
          status: sunshineHealth.status,
          error: sunshineHealth.error,
        },
        orchestrator: {
          vms: metrics.totalVMs || 0,
          readyVMs: metrics.vmsByStatus['READY'] || 0,
          activeSessions: metrics.usedCapacity || 0,
        },
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error({ err: error }, 'Error fetching compute status');
      return reply.status(500).send(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          error instanceof Error ? error.message : 'Failed to fetch compute status'
        )
      );
    }
  }
);

// ============================================================================
// ✅ NEW: WebRTC Session Lifecycle Endpoints
// ============================================================================

const webrtcClient = getWebRTCClient();

/**
 * POST /api/orchestrator/v1/webrtc/session/start
 * Start WebRTC streaming session
 */
app.post<{ Body: { gameId?: string; steamAppId?: number | string } }>(
  '/api/orchestrator/v1/webrtc/session/start',
  { preHandler: [rateLimitMiddleware] },
  async (request, reply) => {
    try {
      const sessionId = require('crypto').randomUUID();
      console.log('[Orchestrator] Starting WebRTC session:', sessionId);

      const { offer } = await webrtcClient.startSession(sessionId);

      console.log('[Orchestrator] ✅ Offer received');
      return reply.status(200).send(successResponse({ sessionId, offer }));
    } catch (error) {
      console.error('[Orchestrator] WebRTC start error:', error);
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, 'WebRTC start failed'));
    }
  }
);

/**
 * POST /api/orchestrator/v1/webrtc/session/answer
 */
app.post<{ Body: { sessionId: string; answer: any } }>(
  '/api/orchestrator/v1/webrtc/session/answer',
  { preHandler: [rateLimitMiddleware] },
  async (request, reply) => {
    try {
      const { sessionId, answer } = request.body;
      console.log('[Orchestrator] Forwarding answer:', sessionId);

      await webrtcClient.sendAnswer(sessionId, answer);

      console.log('[Orchestrator] ✅ Answer forwarded');
      return reply.status(200).send(successResponse({ success: true }));
    } catch (error) {
      console.error('[Orchestrator] Answer forward error:', error);
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, 'Answer forward failed'));
    }
  }
);

/**
 * POST /api/orchestrator/v1/webrtc/session/ice
 */
app.post<{ Body: { sessionId: string; candidate: any } }>(
  '/api/orchestrator/v1/webrtc/session/ice',
  { preHandler: [rateLimitMiddleware] },
  async (request, reply) => {
    try {
      const { sessionId, candidate } = request.body;
      console.log('[Orchestrator] Forwarding ICE:', sessionId);

      await webrtcClient.sendIceCandidate(sessionId, candidate);

      console.log('[Orchestrator] ✅ ICE forwarded');
      return reply.status(200).send(successResponse({ success: true }));
    } catch (error) {
      console.error('[Orchestrator] ICE forward error:', error);
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, 'ICE forward failed'));
    }
  }
);

/**
 * POST /api/orchestrator/v1/webrtc/session/stop
 */
app.post<{ Body: { sessionId: string } }>(
  '/api/orchestrator/v1/webrtc/session/stop',
  { preHandler: [rateLimitMiddleware] },
  async (request, reply) => {
    try {
      const { sessionId } = request.body;
      console.log('[Orchestrator] Stopping session:', sessionId);

      await webrtcClient.stopSession(sessionId);

      console.log('[Orchestrator] ✅ Session stopped');
      return reply.status(200).send(successResponse({ success: true }));
    } catch (error) {
      console.error('[Orchestrator] Stop error:', error);
      return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, 'Stop failed'));
    }
  }
);

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3012', 10);





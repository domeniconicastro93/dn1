import { NextRequest, NextResponse } from 'next/server';
import { requireStrikeSession, getAccessToken } from '@/lib/server/strike-auth';
import { getComputeBaseUrl } from '@/lib/compute-health';
import type { ComputeSessionResponse } from '@/lib/compute-health';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012';
const DEFAULT_REGION = process.env.DEFAULT_COMPUTE_REGION || 'us-east-1';

/**
 * POST /api/compute/start-session
 * 
 * Starts a compute session for a Sunshine application.
 * 
 * This endpoint:
 * 1. Requires user authentication
 * 2. Calls the orchestrator's session creation endpoint
 * 3. Transforms the response to match ComputeSessionResponse
 */
export async function POST(request: NextRequest) {
  try {
    // Require authenticated user
    const authSession = await requireStrikeSession();

    // Parse request body
    const body = await request.json();
    const appId = body?.appId || body?.sunshineAppId;

    if (!appId) {
      return NextResponse.json(
        { error: 'appId is required to start a compute session' },
        { status: 400 }
      );
    }

    // Get access token
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required to start compute session' },
        { status: 401 }
      );
    }

    // Call orchestrator-service via Gateway
    const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const orchestratorResponse = await fetch(`${gatewayUrl}/api/orchestrator/v1/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: authSession.userId,
        appId: appId,
      }),
      cache: 'no-store',
    });

    if (!orchestratorResponse.ok) {
      const errorData = await orchestratorResponse.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message ||
        errorData?.message ||
        `Orchestrator service returned ${orchestratorResponse.status}`
      );
    }

    const sessionData = await orchestratorResponse.json();
    const session = sessionData.data?.session || sessionData.session || sessionData.data;

    // Transform response to ComputeSessionResponse
    // We generate mock IDs for now as the orchestrator is in "minimal" mode
    const response: ComputeSessionResponse = {
      sessionId: session.sessionId || `mock-session-${Date.now()}`,
      vmId: session.vmId || 'mock-vm-1',
      appId: session.appId || appId,
      sunshineAppId: session.appId || appId,
      status: 'active',
      startedAt: new Date().toISOString(),
      // Pass through Sunshine connection info
      host: session.host,
      port: session.port,
      udpPorts: session.udpPorts,
      protocol: session.protocol,
      useHttps: session.useHttps,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting compute session:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required to start compute session' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start compute session',
      },
      { status: 500 }
    );
  }
}


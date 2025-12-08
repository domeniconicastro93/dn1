import { NextResponse } from 'next/server';
import { getComputeBaseUrl } from '@/lib/compute-health';
import type { ComputeStatusResponse } from '@/lib/compute-health';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012';

/**
 * GET /api/compute/status
 * 
 * Fetches VM/compute status from the orchestrator service, including Sunshine health.
 * 
 * This endpoint proxies to the orchestrator's compute/status endpoint,
 * which includes Sunshine connectivity checks.
 */
export async function GET() {
  try {
    // Get compute base URL (for diagnostics)
    getComputeBaseUrl();

    // Call orchestrator's compute status endpoint
    const orchestratorResponse = await fetch(
      `${ORCHESTRATOR_URL}/api/orchestrator/v1/compute/status`,
      {
        cache: 'no-store',
      }
    );

    if (!orchestratorResponse.ok) {
      const errorData = await orchestratorResponse.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message ||
        errorData?.message ||
        `Orchestrator returned ${orchestratorResponse.status}`
      );
    }

    const orchestratorData = await orchestratorResponse.json();
    const data = orchestratorData?.data || orchestratorData;

    // Transform orchestrator response to ComputeStatusResponse format
    const response: ComputeStatusResponse = {
      status: data.status,
      vmId: data.vmId,
      vmName: data.vmName,
      region: data.region,
      updatedAt: data.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching compute status:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch compute status',
        status: 'error',
        vmId: undefined,
        vmName: undefined,
        region: undefined,
        updatedAt: new Date().toISOString(),
      } as ComputeStatusResponse & { error?: string },
      { status: 500 }
    );
  }
}


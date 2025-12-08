import { NextResponse } from 'next/server';
import { getComputeBaseUrl } from '@/lib/compute-health';
import type {
  ComputeApplicationsResponse,
  ComputeApplication,
} from '@/lib/compute-health';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3012';

/**
 * GET /api/compute/applications
 * 
 * Fetches Sunshine applications with Steam mappings from the orchestrator.
 * 
 * This endpoint proxies to the orchestrator's compute/applications endpoint,
 * which handles Sunshine discovery and Steam-Sunshine mapping.
 */
export async function GET() {
  try {
    // Get compute base URL (for diagnostics)
    getComputeBaseUrl();

    // Call orchestrator's compute applications endpoint
    const orchestratorResponse = await fetch(
      `${ORCHESTRATOR_URL}/api/orchestrator/v1/compute/applications`,
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

    // Transform orchestrator response to ComputeApplicationsResponse format
    const applications: ComputeApplication[] = (data.applications || []).map(
      (app: {
        appId: string;
        sunshineAppId?: string;
        steamAppId?: string;
        title: string;
        status: string;
        executablePath?: string;
        description?: string;
        genres?: string[];
        lastUpdated?: string;
      }): ComputeApplication => ({
        appId: app.sunshineAppId || app.appId,
        sunshineAppId: app.sunshineAppId,
        steamAppId: app.steamAppId,
        title: app.title,
        status: app.status,
        description: app.description,
        genres: app.genres,
        lastUpdated: app.lastUpdated,
      })
    );

    // Build ComputeApplicationsResponse
    const response: ComputeApplicationsResponse = {
      vmId: data.vmId,
      vmName: data.vmName,
      region: data.region,
      status: data.status,
      lastSyncedAt: data.lastSyncedAt,
      applications,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching compute applications:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch compute applications',
        vmId: undefined,
        vmName: undefined,
        region: undefined,
        status: 'error',
        applications: [],
      } as ComputeApplicationsResponse,
      { status: 500 }
    );
  }
}


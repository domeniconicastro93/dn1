const COMPUTE_BASE_URL = (process.env.NEXT_PUBLIC_COMPUTE_URL || '').replace(/\/$/, '');

export class ComputeConnectionError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ComputeConnectionError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Get the compute base URL for server-side calls to orchestrator.
 * For client-side, we use Next.js API routes (relative URLs).
 */
export function getComputeBaseUrl(): string {
  if (!COMPUTE_BASE_URL) {
    throw new ComputeConnectionError(
      'NEXT_PUBLIC_COMPUTE_URL is not configured',
      0,
      {
        message: 'Set NEXT_PUBLIC_COMPUTE_URL in your environment (.env.local)',
        example: 'NEXT_PUBLIC_COMPUTE_URL=http://localhost:3012',
        note: 'This should point to the orchestrator service URL',
      }
    );
  }
  return COMPUTE_BASE_URL;
}

export interface ComputeApplication {
  appId: string;
  title?: string;
  status?: string;
  sunshineAppId?: string;
  steamAppId?: string;
  description?: string;
  artworkUrl?: string;
  genres?: string[];
  lastUpdated?: string;
}

export interface ComputeApplicationsResponse {
  vmId?: string;
  vmName?: string;
  region?: string;
  status?: string;
  lastSyncedAt?: string;
  applications: ComputeApplication[];
}

export interface ComputeStatusResponse {
  status?: string;
  vmId?: string;
  vmName?: string;
  region?: string;
  updatedAt?: string;
}

export interface ComputeSessionResponse {
  sessionId: string;
  vmId?: string;
  appId?: string;
  sunshineAppId?: string;
  steamAppId?: string;
  status?: string;
  startedAt?: string;
  streamUrl?: string;
  controlUrl?: string;
  webrtc?: Record<string, unknown>;
  host?: string;
  port?: number;
  udpPorts?: number[];
  protocol?: string;
  useHttps?: boolean;
  [key: string]: unknown;
}

export interface ComputeDiagnostics {
  baseUrl: string;
  ok: boolean;
  applications?: ComputeApplicationsResponse;
  status?: ComputeStatusResponse;
  error?: string;
}

/**
 * Make a request to a Next.js API route (relative URL).
 * These routes will proxy to the orchestrator service.
 */
async function requestApiRoute<T>(path: string, init?: RequestInit): Promise<T> {
  // Use relative URL to call Next.js API routes
  const url = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ComputeConnectionError(
      `Compute API request failed with status ${response.status}`,
      response.status,
      details
    );
  }

  const payload = await response.json().catch(() => ({}));
  return (payload?.data ?? payload) as T;
}

/**
 * Fetch compute applications from the orchestrator.
 * This calls the Next.js API route which proxies to the orchestrator/steam-library-service.
 */
export async function fetchComputeApplications(): Promise<ComputeApplicationsResponse> {
  return requestApiRoute<ComputeApplicationsResponse>('/api/compute/applications');
}

/**
 * Fetch compute status from the orchestrator.
 * This calls the Next.js API route which proxies to the orchestrator.
 */
export async function fetchComputeStatus(): Promise<ComputeStatusResponse> {
  return requestApiRoute<ComputeStatusResponse>('/api/compute/status');
}

/**
 * Start a compute session for a Sunshine application.
 * This calls the Next.js API route which proxies to the orchestrator.
 */
export async function startComputeSession(appId: string): Promise<ComputeSessionResponse> {
  if (!appId) {
    throw new ComputeConnectionError('Cannot start session without an application id');
  }
  return requestApiRoute<ComputeSessionResponse>('/api/compute/start-session', {
    method: 'POST',
    body: JSON.stringify({ appId }),
  });
}

export async function getComputeDiagnostics(): Promise<ComputeDiagnostics> {
  // Check if base URL is configured
  let baseUrl = '';
  try {
    baseUrl = getComputeBaseUrl();
  } catch (error) {
    if (error instanceof ComputeConnectionError) {
      return {
        baseUrl: '',
        ok: false,
        error: error.message,
      };
    }
    throw error;
  }

  const [appsResult, statusResult] = await Promise.allSettled([
    fetchComputeApplications(),
    fetchComputeStatus(),
  ]);

  const diagnostics: ComputeDiagnostics = {
    baseUrl,
    ok: appsResult.status === 'fulfilled' && statusResult.status === 'fulfilled',
  };

  if (appsResult.status === 'fulfilled') {
    diagnostics.applications = appsResult.value;
  } else if (appsResult.reason instanceof Error) {
    const error = appsResult.reason;
    if (error instanceof ComputeConnectionError) {
      diagnostics.error = error.message;
    } else {
      diagnostics.error = `Failed to fetch applications: ${error.message}`;
    }
  }

  if (statusResult.status === 'fulfilled') {
    diagnostics.status = statusResult.value;
  } else if (statusResult.reason instanceof Error) {
    diagnostics.error = statusResult.reason.message;
  }

  if (!diagnostics.ok && !diagnostics.error) {
    diagnostics.error = 'Unable to reach orchestrator compute endpoints. Check that NEXT_PUBLIC_COMPUTE_URL is set and the orchestrator service is running.';
  }

  return diagnostics;
}

export function normalizeApplicationTitle(app: ComputeApplication): string {
  return (
    app.title ||
    (app as { name?: string }).name ||
    app.sunshineAppId ||
    app.appId ||
    'Unknown app'
  );
}

export function normalizeApplicationStatus(app: ComputeApplication): string {
  return app.status || 'installed';
}

export function hasComputeBaseUrl(): boolean {
  return Boolean(COMPUTE_BASE_URL);
}



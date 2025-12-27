/**
 * VM Agent Client for Orchestrator Service
 * 
 * Communicates with Strike VM Agent running on Windows VMs to:
 * - Check VM health
 * - Launch Steam games
 * - Manage game processes
 * 
 * Single source of truth for VM Agent communication.
 */

const VM_AGENT_URL = process.env.VM_AGENT_URL || 'http://127.0.0.1:8787';
const STRIKE_AGENT_KEY = process.env.STRIKE_AGENT_KEY || process.env.VM_AGENT_TOKEN; // Prefer STRIKE_AGENT_KEY
const VM_AGENT_TIMEOUT_MS = parseInt(process.env.VM_AGENT_TIMEOUT_MS || '10000', 10); // Increased to 10s

if (!STRIKE_AGENT_KEY) {
    console.warn('[VMAgentClient] ⚠️ STRIKE_AGENT_KEY not set - VM game launching will not work');
}

export interface VMHealthResponse {
    ok: boolean;
    hostname?: string;
    user?: string;
    uptime?: number;
    time?: string;
    platform?: string;
    release?: string;
    error?: string;
}

export interface VMLaunchResponse {
    ok: boolean;
    steamAppId?: number;
    error?: string;
}

/**
 * VM Agent Client - Single source of truth for VM Agent calls
 */
export class VMAgentClient {
    private agentUrl: string;
    private token: string;
    private timeout: number;

    constructor(agentUrl?: string, token?: string, timeout?: number) {
        this.agentUrl = agentUrl || VM_AGENT_URL;
        this.token = token || STRIKE_AGENT_KEY || '';
        this.timeout = timeout || VM_AGENT_TIMEOUT_MS;

        console.log('[VMAgentClient] Initialized');
        console.log('[VMAgentClient] URL:', this.agentUrl);
        console.log('[VMAgentClient] Token:', this.token ? this.token.substring(0, 8) + '...' : 'NOT SET');
        console.log('[VMAgentClient] Timeout:', this.timeout + 'ms');
    }

    /**
     * Check VM health
     */
    async health(): Promise<VMHealthResponse> {
        console.log('[VMAgentClient] Checking VM health');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.agentUrl}/health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`VM Agent health check failed: ${response.status}`);
            }

            const data: VMHealthResponse = await response.json();
            console.log('[VMAgentClient] ✅ VM is healthy:', data.hostname);

            return data;
        } catch (error: any) {
            console.error('[VMAgentClient] ❌ Health check failed:', error.message);

            if (error.name === 'AbortError') {
                return { ok: false, error: 'VM Agent health check timeout' };
            }

            return { ok: false, error: error.message };
        }
    }

    /**
     * Launch a Steam game on VM
     */
    async launchGame(steamAppId: number | string): Promise<VMLaunchResponse> {
        const startTime = Date.now();
        console.log('[VMAgentClient] Launching Steam game:', steamAppId);
        console.log('[VMAgentClient] VM Agent URL:', this.agentUrl);
        console.log('[VMAgentClient] Using auth key:', this.token ? this.token.substring(0, 8) + '...' : 'NONE');

        if (!this.token) {
            console.error('[VMAgentClient] ❌ Cannot launch game: STRIKE_AGENT_KEY not configured');
            return { ok: false, error: 'STRIKE_AGENT_KEY not configured' };
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            // ✅ FIX: Use proven endpoint and headers from manual test
            const response = await fetch(`${this.agentUrl}/launch`, { // Changed from /api/launch
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Strike-Token': this.token // Changed from x-strike-agent-key
                },
                // ✅ FIX: Send steamAppId as string, matching proven curl command
                body: JSON.stringify({ steamAppId: String(steamAppId) }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const elapsed = Date.now() - startTime;

            console.log('[VMAgentClient] Response status:', response.status, 'in', elapsed, 'ms');

            const data: VMLaunchResponse = await response.json();
            console.log('[VMAgentClient] Response body:', JSON.stringify(data));

            if (!response.ok || !data.ok) {
                console.error('[VMAgentClient] ❌ Launch failed:', data.error || response.statusText);
                return { ok: false, error: data.error || `HTTP ${response.status}` };
            }

            console.log('[VMAgentClient] ✅ Game launched successfully in', elapsed, 'ms');
            return data;
        } catch (error: any) {
            const elapsed = Date.now() - startTime;
            console.error('[VMAgentClient] ❌ Launch request failed after', elapsed, 'ms:', error.message);

            if (error.name === 'AbortError') {
                return { ok: false, error: 'VM Agent launch timeout' };
            }

            return { ok: false, error: error.message };
        }
    }

    /**
     * Get VM Agent URL
     */
    getAgentUrl(): string {
        return this.agentUrl;
    }
}

// Singleton instance
let vmAgentClientInstance: VMAgentClient | null = null;

/**
 * Get VM Agent client singleton
 */
export function getVMAgentClient(): VMAgentClient {
    if (!vmAgentClientInstance) {
        vmAgentClientInstance = new VMAgentClient();
    }
    return vmAgentClientInstance;
}

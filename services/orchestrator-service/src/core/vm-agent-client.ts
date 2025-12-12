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

const VM_AGENT_URL = process.env.VM_AGENT_URL || 'http://localhost:8787';
const VM_AGENT_TOKEN = process.env.VM_AGENT_TOKEN;
const VM_AGENT_TIMEOUT_MS = parseInt(process.env.VM_AGENT_TIMEOUT_MS || '5000', 10);

if (!VM_AGENT_TOKEN) {
    console.warn('[VMAgentClient] ⚠️ VM_AGENT_TOKEN not set - VM game launching will not work');
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
        this.token = token || VM_AGENT_TOKEN || '';
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
        console.log('[VMAgentClient] Launching Steam game:', steamAppId);

        if (!this.token) {
            console.error('[VMAgentClient] ❌ Cannot launch game: VM_AGENT_TOKEN not configured');
            return { ok: false, error: 'VM_AGENT_TOKEN not configured' };
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.agentUrl}/launch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Strike-Token': this.token
                },
                body: JSON.stringify({ steamAppId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data: VMLaunchResponse = await response.json();

            if (!response.ok || !data.ok) {
                console.error('[VMAgentClient] ❌ Launch failed:', data.error || response.statusText);
                return { ok: false, error: data.error || `HTTP ${response.status}` };
            }

            console.log('[VMAgentClient] ✅ Game launched successfully');
            return data;
        } catch (error: any) {
            console.error('[VMAgentClient] ❌ Launch request failed:', error.message);

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

/**
 * Sunshine Client - Real Implementation
 * 
 * Phase 11.A2: Real HTTPS communication with Sunshine server
 * 
 * Sunshine Configuration:
 * - Host: 20.31.130.73
 * - Stream Port: 47984 (WebRTC streaming)
 * - Web Port: 47985 (Web UI / API)
 * - Username: strike
 * - Password: Nosmoking93!!
 * - Protocol: HTTPS (self-signed certificate)
 */

import https from 'https';
import type {
    SunshineCredentials,
    SunshineSessionInfo,
    SunshineApp,
} from '../types/webrtc';

/**
 * Sunshine client configuration
 */
export interface SunshineClientConfig {
    /** VM host (IP or hostname) */
    host: string;
    /** Streaming port (default: 47984) */
    streamPort: number;
    /** Web UI port (default: 47985) */
    webPort: number;
    /** Authentication credentials */
    credentials: SunshineCredentials;
    /** Use HTTPS for Web UI */
    useHttps: boolean;
    /** Request timeout (ms) */
    timeout: number;
    /** Verify SSL certificates */
    verifySsl: boolean;
}

/**
 * Sunshine API Response
 */
interface SunshineApiResponse<T = any> {
    status?: string;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * HTTPS Agent for self-signed certificates
 */
const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Accept self-signed certificates
});

/**
 * Sunshine API Client
 * 
 * Phase 11.A2: Real implementation with HTTPS
 */
export class SunshineClient {
    private config: SunshineClientConfig;
    private sessionToken: string | null = null;
    private authenticated: boolean = false;
    private cookies: string[] = [];

    constructor(config: Partial<SunshineClientConfig> = {}) {
        // Load from environment with fallbacks
        this.config = {
            host: config.host || process.env.SUNSHINE_VM_HOST || '20.31.130.73',
            streamPort: config.streamPort || parseInt(process.env.SUNSHINE_STREAM_PORT || '47984', 10),
            webPort: config.webPort || parseInt(process.env.SUNSHINE_WEB_PORT || '47985', 10),
            credentials: config.credentials || {
                username: process.env.SUNSHINE_USERNAME || 'strike',
                password: process.env.SUNSHINE_PASSWORD || '',
            },
            useHttps: config.useHttps ?? true, // Default to HTTPS
            timeout: config.timeout || parseInt(process.env.SUNSHINE_TIMEOUT || '10000', 10),
            verifySsl: config.verifySsl ?? false, // Don't verify self-signed certs
        };

        // Validate credentials
        if (!this.config.credentials.password) {
            throw new Error('SUNSHINE_PASSWORD is required');
        }

        console.log('[SunshineClient] Initialized with config:', {
            host: this.config.host,
            streamPort: this.config.streamPort,
            webPort: this.config.webPort,
            username: this.config.credentials.username,
            useHttps: this.config.useHttps,
            verifySsl: this.config.verifySsl,
        });
    }

    /**
     * Get base URL for Sunshine Web UI
     */
    private getWebUrl(): string {
        const protocol = this.config.useHttps ? 'https' : 'http';
        return `${protocol}://${this.config.host}:${this.config.webPort}`;
    }

    /**
     * Get streaming URL for WebRTC
     */
    public getStreamUrl(): string {
        return `${this.config.host}:${this.config.streamPort}`;
    }

    /**
     * Make HTTP request to Sunshine API
     */
    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.getWebUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

        console.log('[SunshineClient] Request:', {
            method: options.method || 'GET',
            url,
            hasAuth: !!this.sessionToken,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...((options.headers as Record<string, string>) || {}),
            };

            // Add authentication
            if (this.sessionToken) {
                headers['Authorization'] = `Basic ${this.sessionToken}`;
            }

            // Add cookies
            if (this.cookies.length > 0) {
                headers['Cookie'] = this.cookies.join('; ');
            }

            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
                // @ts-ignore - Node.js specific
                agent: this.config.useHttps ? httpsAgent : undefined,
            });

            clearTimeout(timeoutId);

            // Store cookies from response
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                this.cookies.push(setCookie);
            }

            console.log('[SunshineClient] Response:', {
                status: response.status,
                statusText: response.statusText,
            });

            if (!response.ok) {
                let errorDetails: any;
                try {
                    errorDetails = await response.json();
                } catch {
                    errorDetails = await response.text();
                }

                console.error('[SunshineClient] Error response:', errorDetails);

                throw new Error(
                    `Sunshine API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`
                );
            }

            // Try to parse JSON response
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = await response.json();
                console.log('[SunshineClient] Response data:', data);
                return data as T;
            }

            // Return text for non-JSON responses
            const text = await response.text();
            console.log('[SunshineClient] Response text:', text.substring(0, 200));
            return text as any;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Sunshine API request timed out after ${this.config.timeout}ms`);
            }

            if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
                throw new Error(
                    `Cannot connect to Sunshine at ${url}. Check that Sunshine is running and port ${this.config.webPort} is accessible.`
                );
            }

            throw error;
        }
    }

    /**
     * Authenticate with Sunshine Web UI
     * 
     * Phase 11.A2: Simplified to use Basic Auth only
     * 
     * @returns Session info
     */
    async login(): Promise<SunshineSessionInfo> {
        console.log('[SunshineClient] login() - Authenticating with Sunshine');

        try {
            // Create Basic Auth header
            const credentials = Buffer.from(
                `${this.config.credentials.username}:${this.config.credentials.password}`
            ).toString('base64');

            // Store credentials for future requests
            this.sessionToken = credentials;

            console.log('[SunshineClient] Testing authentication with /api/apps...');

            // Test authentication by getting apps list
            const apps = await this.request<SunshineApp[] | { apps: SunshineApp[] }>('/api/apps', {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                },
            });

            // Handle different response formats
            let appsList: SunshineApp[];
            if (Array.isArray(apps)) {
                appsList = apps;
            } else if (apps && typeof apps === 'object' && 'apps' in apps) {
                appsList = apps.apps;
            } else {
                console.warn('[SunshineClient] Unexpected apps response format:', apps);
                appsList = [];
            }

            console.log('[SunshineClient] ✅ Authentication successful!');
            console.log('[SunshineClient] Found', appsList.length, 'applications');

            this.authenticated = true;

            // Try to get version
            let version: string | undefined;
            try {
                const configResponse = await this.request<any>('/api/config', {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                    },
                });
                version = configResponse?.version || 'unknown';
            } catch (error) {
                console.warn('[SunshineClient] Failed to get version:', error);
                version = 'unknown';
            }

            return {
                authenticated: true,
                token: this.sessionToken,
                version,
                apps: appsList,
            };
        } catch (error) {
            console.error('[SunshineClient] ❌ Authentication failed:', error);
            this.authenticated = false;
            throw new Error(`Sunshine authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get available applications
     * 
     * Phase 11.A2: Real implementation
     * 
     * @returns List of available apps
     */
    async getApplications(): Promise<SunshineApp[]> {
        console.log('[SunshineClient] getApplications() - Fetching app list');

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        try {
            const response = await this.request<SunshineApp[] | { apps: SunshineApp[] }>('/api/apps');

            // Handle different response formats
            let apps: SunshineApp[];
            if (Array.isArray(response)) {
                apps = response;
            } else if (response && typeof response === 'object' && 'apps' in response) {
                apps = response.apps;
            } else {
                console.warn('[SunshineClient] Unexpected apps response format:', response);
                apps = [];
            }

            console.log('[SunshineClient] Found', apps.length, 'applications');
            apps.forEach((app, idx) => {
                console.log(`[SunshineClient]   ${idx}. ${app.name} (index: ${app.index})`);
            });

            return apps;
        } catch (error) {
            console.error('[SunshineClient] Failed to get applications:', error);
            throw new Error(`Failed to get Sunshine applications: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Launch a game using Steam URI
     * 
     * Phase 11.A2: Real implementation
     * 
     * @param steamAppId - Steam App ID
     */
    async launchSteamGame(steamAppId: string): Promise<void> {
        console.log('[SunshineClient] launchSteamGame() - Launching Steam game:', steamAppId);

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        const steamUri = `steam://rungameid/${steamAppId}`;
        console.log('[SunshineClient] Steam URI:', steamUri);

        try {
            // Try to launch via Sunshine's launch endpoint
            await this.request('/api/apps/launch', {
                method: 'POST',
                body: JSON.stringify({
                    app: steamUri,
                }),
            });

            console.log('[SunshineClient] Game launched successfully');
        } catch (error) {
            console.error('[SunshineClient] Game launch failed:', error);
            throw new Error(`Failed to launch game ${steamAppId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Launch application by index
     * 
     * @param appIndex - Application index
     */
    async launchApplication(appIndex: number): Promise<void> {
        console.log('[SunshineClient] launchApplication() - Launching app index:', appIndex);

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        try {
            await this.request(`/api/apps/${appIndex}/start`, {
                method: 'POST',
            });

            console.log('[SunshineClient] Application launched successfully');
        } catch (error) {
            console.error('[SunshineClient] Application launch failed:', error);
            throw new Error(`Failed to launch application ${appIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Stop currently running application
     */
    async stopApplication(): Promise<void> {
        console.log('[SunshineClient] stopApplication() - Stopping current app');

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        try {
            await this.request('/api/apps/stop', {
                method: 'POST',
            });

            console.log('[SunshineClient] Application stopped successfully');
        } catch (error) {
            console.error('[SunshineClient] Application stop failed:', error);
            // Don't throw - stopping is best-effort
        }
    }

    /**
     * Start a streaming session (placeholder for WebRTC)
     * 
     * Phase 11.A2: Basic implementation
     * Phase 11.A3: Full WebRTC implementation
     */
    async startSession(appId: string): Promise<{ sessionId: string; streamUrl: string }> {
        console.log('[SunshineClient] startSession() - Starting session for app:', appId);

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        // For now, just return connection details
        // WebRTC implementation in Phase 11.A3
        const sessionId = `session-${Date.now()}`;

        return {
            sessionId,
            streamUrl: this.getStreamUrl(),
        };
    }

    /**
     * Get session status (placeholder)
     */
    async getSessionStatus(sessionId: string): Promise<{ state: string; active: boolean }> {
        console.log('[SunshineClient] getSessionStatus() - Checking session:', sessionId);

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        // Placeholder - real implementation in Phase 11.A3
        return {
            state: 'ACTIVE',
            active: true,
        };
    }

    /**
     * Stop a streaming session (placeholder)
     */
    async stopSession(sessionId: string): Promise<void> {
        console.log('[SunshineClient] stopSession() - Stopping session:', sessionId);

        if (!this.authenticated) {
            throw new Error('Not authenticated. Call login() first.');
        }

        // Stop any running application
        await this.stopApplication();
    }

    /**
     * Test connection to Sunshine
     * 
     * Phase 11.A2: Real implementation
     */
    async testConnection(): Promise<{ connected: boolean; error?: string }> {
        console.log('[SunshineClient] testConnection() - Testing connection');

        try {
            // Try to access a simple endpoint
            await this.request('/api/config', {
                method: 'GET',
            });

            return { connected: true };
        } catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get client configuration
     */
    public getConfig(): Readonly<SunshineClientConfig> {
        return { ...this.config };
    }

    /**
     * Check if authenticated
     */
    public isAuthenticated(): boolean {
        return this.authenticated;
    }
}

/**
 * Create a new Sunshine client instance
 */
export function createSunshineClient(config?: Partial<SunshineClientConfig>): SunshineClient {
    return new SunshineClient(config);
}

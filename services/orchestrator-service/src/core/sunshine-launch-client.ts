/**
 * Sunshine Launch Client
 * 
 * Handles launching applications via Sunshine using session keys
 * Supports Steam game launching via steam:// protocol
 */

import https from 'https';

export interface SunshineLaunchConfig {
    host: string;
    port: number;
    useHttps: boolean;
    verifySsl: boolean;
}

export interface LaunchResult {
    success: boolean;
    appId?: string;
    error?: string;
}

export class SunshineLaunchClient {
    private config: SunshineLaunchConfig;
    private httpsAgent: https.Agent | undefined;
    private sessionKey: string;

    constructor(config: SunshineLaunchConfig, sessionKey: string) {
        this.config = config;
        this.sessionKey = sessionKey;

        // Create HTTPS agent for self-signed certificates
        if (this.config.useHttps && !this.config.verifySsl) {
            this.httpsAgent = new https.Agent({
                rejectUnauthorized: false,
            });
        }
    }

    /**
     * Get the base URL for Sunshine API
     */
    private getBaseUrl(): string {
        const protocol = this.config.useHttps ? 'https' : 'http';
        return `${protocol}://${this.config.host}:${this.config.port}`;
    }

    /**
     * Make a request to Sunshine API with session key
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.getBaseUrl()}${endpoint}`;

        const fetchOptions: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-Sunshine-Session': this.sessionKey,
                ...options.headers,
            },
        };

        // Add HTTPS agent for self-signed certificates
        if (this.httpsAgent) {
            (fetchOptions as any).agent = this.httpsAgent;
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sunshine API request failed: ${response.status} ${errorText}`);
        }

        return await response.json() as T;
    }

    /**
     * Launch a Steam game by Steam App ID
     */
    async launchSteamGame(steamAppId: string | number): Promise<LaunchResult> {
        try {
            console.log(`[SunshineLaunch] Launching Steam game: ${steamAppId}`);

            const response = await this.request<{ success: boolean; appId?: string }>('/api/launch', {
                method: 'POST',
                body: JSON.stringify({
                    app: `steam://rungameid/${steamAppId}`,
                }),
            });

            console.log('[SunshineLaunch] Launch successful');

            return {
                success: true,
                appId: response.appId,
            };
        } catch (error) {
            console.error('[SunshineLaunch] Launch failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Launch a custom application
     */
    async launchApp(appCommand: string): Promise<LaunchResult> {
        try {
            console.log(`[SunshineLaunch] Launching app: ${appCommand}`);

            const response = await this.request<{ success: boolean; appId?: string }>('/api/launch', {
                method: 'POST',
                body: JSON.stringify({
                    app: appCommand,
                }),
            });

            console.log('[SunshineLaunch] Launch successful');

            return {
                success: true,
                appId: response.appId,
            };
        } catch (error) {
            console.error('[SunshineLaunch] Launch failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get list of available apps
     */
    async getApps(): Promise<any[]> {
        try {
            const response = await this.request<any[]>('/api/apps', {
                method: 'GET',
            });

            return response;
        } catch (error) {
            console.error('[SunshineLaunch] Failed to get apps:', error);
            return [];
        }
    }

    /**
     * Update session key
     */
    setSessionKey(sessionKey: string): void {
        this.sessionKey = sessionKey;
    }
}

export function createSunshineLaunchClient(
    config: SunshineLaunchConfig,
    sessionKey: string
): SunshineLaunchClient {
    return new SunshineLaunchClient(config, sessionKey);
}

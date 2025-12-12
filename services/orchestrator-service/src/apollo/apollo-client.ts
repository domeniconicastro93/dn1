import https from 'https';

/**
 * Apollo Client - Interacts with Apollo server API
 * 
 * Responsibilities:
 * - Launch applications on Apollo
 * - Stop applications
 * - Get application status
 * - Manage WebRTC streaming
 */

export interface ApolloConfig {
    host: string;
    port: number;
    username: string;
    password: string;
}

export interface ApolloApp {
    id: string;
    name: string;
    running: boolean;
}

export class ApolloClient {
    private config: ApolloConfig;
    private authHeader: string;

    constructor(config: ApolloConfig) {
        this.config = config;
        // Create Basic Auth header
        this.authHeader = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');

        console.log('[ApolloClient] Initialized:', {
            host: config.host,
            port: config.port,
            username: config.username
        });
    }

    /**
     * Launch an application on Apollo
     * 
     * @param appName - Name of the app to launch (e.g., "CapcomArcadeStadium", "Steam")
     * @returns Success status
     */
    async launchApp(appName: string): Promise<{ success: boolean; error?: string }> {
        console.log(`[ApolloClient] Launching app: ${appName}`);

        const url = `https://${this.config.host}:${this.config.port}/api/apps/launch`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.authHeader
                },
                body: JSON.stringify({
                    app: appName
                }),
                // @ts-ignore - Allow self-signed certificates
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ApolloClient] Launch failed:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                return {
                    success: false,
                    error: `Apollo API error: ${response.status} ${response.statusText} - ${errorText}`
                };
            }

            const data: any = await response.json();
            console.log(`[ApolloClient] App launched successfully:`, data);

            return { success: true };
        } catch (error: any) {
            console.error(`[ApolloClient] Exception launching app:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop an application on Apollo
     * 
     * @param appName - Name of the app to stop
     * @returns Success status
     */
    async stopApp(appName: string): Promise<{ success: boolean; error?: string }> {
        console.log(`[ApolloClient] Stopping app: ${appName}`);

        const url = `https://${this.config.host}:${this.config.port}/api/apps/stop`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.authHeader
                },
                body: JSON.stringify({
                    app: appName
                }),
                // @ts-ignore
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `Apollo API error: ${response.status} ${response.statusText} - ${errorText}`
                };
            }

            const data: any = await response.json();
            console.log(`[ApolloClient] App stopped successfully:`, data);

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get list of available applications
     * 
     * @returns List of apps
     */
    async getApps(): Promise<{ success: boolean; apps?: ApolloApp[]; error?: string }> {
        console.log(`[ApolloClient] Getting apps list`);

        const url = `https://${this.config.host}:${this.config.port}/api/apps`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': this.authHeader
                },
                // @ts-ignore
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `Apollo API error: ${response.status} ${response.statusText} - ${errorText}`
                };
            }

            const data: any = await response.json();
            console.log(`[ApolloClient] Apps retrieved:`, data);

            return {
                success: true,
                apps: data.apps || []
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test connection to Apollo
     * 
     * @returns Connection status
     */
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        console.log(`[ApolloClient] Testing connection to Apollo`);

        const url = `https://${this.config.host}:${this.config.port}/api/ping`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': this.authHeader
                },
                // @ts-ignore
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Apollo not reachable: ${response.status} ${response.statusText}`
                };
            }

            console.log(`[ApolloClient] Connection successful`);
            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

/**
 * Create Apollo client instance
 */
export function createApolloClient(config?: Partial<ApolloConfig>): ApolloClient {
    const defaultConfig: ApolloConfig = {
        host: process.env.APOLLO_HOST || '20.31.130.73',
        port: parseInt(process.env.APOLLO_PORT || '47990', 10),
        username: process.env.APOLLO_USERNAME || 'strike',
        password: process.env.APOLLO_PASSWORD || 'Nosmoking93!!'
    };

    return new ApolloClient({ ...defaultConfig, ...config });
}

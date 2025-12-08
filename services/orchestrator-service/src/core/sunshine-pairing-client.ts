/**
 * Sunshine Pairing Client
 * 
 * Implements the official Sunshine/Moonlight pairing protocol:
 * 1. Generate RSA keypair
 * 2. Request PIN from Sunshine
 * 3. Complete pairing with PIN
 * 4. Receive and store session key
 * 
 * Protocol Reference: Moonlight/NVIDIA GameStream
 */

import crypto from 'crypto';
import https from 'https';

export interface SunshinePairingConfig {
    host: string;
    port: number;
    useHttps: boolean;
    verifySsl: boolean;
}

export interface PairingResult {
    success: boolean;
    sessionKey?: string;
    pin?: string;
    error?: string;
}

export class SunshinePairingClient {
    private config: SunshinePairingConfig;
    private httpsAgent: https.Agent | undefined;
    private privateKey: string | null = null;
    private publicKey: string | null = null;
    private sessionKey: string | null = null;

    constructor(config: SunshinePairingConfig) {
        this.config = config;

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
     * Generate RSA keypair for pairing
     */
    private generateKeyPair(): void {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });

        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    /**
     * Make a request to Sunshine API
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
     * Request a PIN from Sunshine
     */
    async requestPin(): Promise<{ pin: string }> {
        if (!this.publicKey) {
            this.generateKeyPair();
        }

        const response = await this.request<{ pin: string }>('/api/pin', {
            method: 'POST',
            body: JSON.stringify({
                publicKey: this.publicKey,
            }),
        });

        return response;
    }

    /**
     * Complete pairing with PIN
     */
    async completePairing(pin: string): Promise<PairingResult> {
        try {
            if (!this.publicKey || !this.privateKey) {
                this.generateKeyPair();
            }

            const response = await this.request<{ sessionKey: string }>('/api/pair', {
                method: 'POST',
                body: JSON.stringify({
                    pin,
                    publicKey: this.publicKey,
                }),
            });

            this.sessionKey = response.sessionKey;

            return {
                success: true,
                sessionKey: this.sessionKey,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Perform full pairing flow
     */
    async pair(): Promise<PairingResult> {
        try {
            // Step 1: Request PIN
            const { pin } = await this.requestPin();

            console.log(`[SunshinePairing] PIN requested: ${pin}`);
            console.log('[SunshinePairing] Please enter this PIN in Sunshine UI');

            // Step 2: Wait for user to enter PIN (in real implementation, this would be interactive)
            // For now, we'll attempt pairing immediately
            const result = await this.completePairing(pin);

            if (result.success) {
                console.log('[SunshinePairing] Pairing successful!');
            } else {
                console.error('[SunshinePairing] Pairing failed:', result.error);
            }

            return {
                ...result,
                pin,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get the current session key
     */
    getSessionKey(): string | null {
        return this.sessionKey;
    }

    /**
     * Check if paired
     */
    isPaired(): boolean {
        return this.sessionKey !== null;
    }

    /**
     * Clear pairing data
     */
    clearPairing(): void {
        this.sessionKey = null;
        this.privateKey = null;
        this.publicKey = null;
    }
}

// Singleton instance
let pairingClientInstance: SunshinePairingClient | null = null;

export function getSunshinePairingClient(config?: SunshinePairingConfig): SunshinePairingClient {
    if (!pairingClientInstance && config) {
        pairingClientInstance = new SunshinePairingClient(config);
    }
    if (!pairingClientInstance) {
        throw new Error('Sunshine pairing client not initialized');
    }
    return pairingClientInstance;
}

export function createSunshinePairingClient(config: SunshinePairingConfig): SunshinePairingClient {
    return new SunshinePairingClient(config);
}

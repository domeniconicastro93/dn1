import https from 'https';
import crypto from 'crypto';

/**
 * Apollo Pairing Client
 * 
 * Handles the pairing process with Apollo server
 * Based on Moonlight protocol
 */

export interface PairingConfig {
    host: string;
    port: number;
}

export interface PairingResult {
    success: boolean;
    pinRequired?: boolean;
    pin?: string;
    error?: string;
}

export class ApolloPairingClient {
    private config: PairingConfig;
    private clientId: string;

    constructor(config: PairingConfig) {
        this.config = config;
        // Generate unique client ID
        this.clientId = crypto.randomBytes(8).toString('hex');

        console.log('[ApolloPairing] Initialized:', {
            host: config.host,
            port: config.port,
            clientId: this.clientId
        });
    }

    /**
     * Request pairing with Apollo
     * This will trigger Apollo to generate a PIN
     */
    async requestPairing(): Promise<PairingResult> {
        console.log('[ApolloPairing] Requesting pairing...');

        const url = `https://${this.config.host}:${this.config.port}/pair?uniqueid=${this.clientId}&devicename=Strike&phrase=getservercert`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                // @ts-ignore - Allow self-signed certificates
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            const text = await response.text();
            console.log('[ApolloPairing] Pairing response:', {
                status: response.status,
                body: text
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Pairing request failed: ${response.status} ${response.statusText}`
                };
            }

            // Check if PIN is required
            if (text.includes('pin')) {
                console.log('[ApolloPairing] ⚠️  PIN REQUIRED! Check Apollo logs on VM for the 4-digit PIN.');
                return {
                    success: false,
                    pinRequired: true,
                    error: 'PIN required. Check Apollo logs on VM.'
                };
            }

            return {
                success: true,
                pinRequired: false
            };
        } catch (error: any) {
            console.error('[ApolloPairing] Exception:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Complete pairing by sending PIN
     * 
     * @param pin - 4-digit PIN from Apollo logs
     */
    async completePairing(pin: string): Promise<PairingResult> {
        console.log('[ApolloPairing] Completing pairing with PIN...');

        const url = `https://${this.config.host}:${this.config.port}/pair?uniqueid=${this.clientId}&devicename=Strike&phrase=pairchallenge&pin=${pin}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                // @ts-ignore
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            const text = await response.text();
            console.log('[ApolloPairing] PIN response:', {
                status: response.status,
                body: text
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `PIN verification failed: ${response.status} ${response.statusText}`
                };
            }

            if (text.includes('paired')) {
                console.log('[ApolloPairing] ✅ PAIRING SUCCESSFUL!');
                return {
                    success: true
                };
            }

            return {
                success: false,
                error: 'Pairing failed. Invalid PIN?'
            };
        } catch (error: any) {
            console.error('[ApolloPairing] Exception:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test if already paired
     */
    async testConnection(): Promise<boolean> {
        console.log('[ApolloPairing] Testing connection...');

        const url = `https://${this.config.host}:${this.config.port}/serverinfo`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                // @ts-ignore
                agent: new https.Agent({ rejectUnauthorized: false })
            });

            if (response.ok) {
                const text = await response.text();
                console.log('[ApolloPairing] Server info:', text.substring(0, 200));
                return true;
            }

            return false;
        } catch (error: any) {
            console.error('[ApolloPairing] Connection test failed:', error.message);
            return false;
        }
    }
}

/**
 * Create Apollo pairing client
 */
export function createApolloPairingClient(config?: Partial<PairingConfig>): ApolloPairingClient {
    const defaultConfig: PairingConfig = {
        host: process.env.APOLLO_HOST || '20.31.130.73',
        port: parseInt(process.env.APOLLO_PORT || '47990', 10)
    };

    return new ApolloPairingClient({ ...defaultConfig, ...config });
}

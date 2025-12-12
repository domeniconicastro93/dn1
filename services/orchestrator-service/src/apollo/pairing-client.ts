import https from 'https';
import { v4 as uuidv4 } from 'uuid';

export interface PairingResult {
    success: boolean;
    pairingId?: string;
    error?: string;
}

export class ApolloPairingClient {
    private host: string;
    private port: number;
    private uniqueId: string;

    constructor(host: string, port: number = 47990) {
        this.host = host;
        this.port = port;
        this.uniqueId = uuidv4().replace(/-/g, '');

        console.log('[ApolloPairing] Initialized:', {
            host: host,
            port: port,
            uniqueId: this.uniqueId
        });
    }

    /**
     * Request pairing with Apollo server
     * This will trigger PIN generation on Apollo
     */
    async requestPairing(): Promise<PairingResult> {
        console.log('[ApolloPairing] Requesting pairing...');
        console.log(`[ApolloPairing] POST https://${this.host}:${this.port}/api/pair`);

        try {
            const response = await this.makeRequest('POST', '/api/pair', {
                uniqueid: this.uniqueId,
                devicename: 'Strike Cloud Gaming',
                cert: '-----BEGIN CERTIFICATE-----\nDUMMY\n-----END CERTIFICATE-----',
            });

            console.log('[ApolloPairing] Pairing response:', response);

            if (response.pairingId) {
                return {
                    success: true,
                    pairingId: response.pairingId,
                };
            }

            // If no pairingId but success, assume PIN is required
            return {
                success: true,
                error: 'PIN required - check VM monitor'
            };
        } catch (error: any) {
            console.error('[ApolloPairing] Pairing request failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Complete pairing with PIN
     */
    async completePairing(pin: string): Promise<PairingResult> {
        console.log('[ApolloPairing] Completing pairing with PIN...');
        console.log(`[ApolloPairing] POST https://${this.host}:${this.port}/api/pin`);

        try {
            const response = await this.makeRequest('POST', '/api/pin', {
                pin: pin,
            });

            console.log('[ApolloPairing] PIN response:', response);

            return { success: true };
        } catch (error: any) {
            console.error('[ApolloPairing] PIN verification failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Make HTTPS request to Apollo
     */
    private async makeRequest(method: string, path: string, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const bodyData = body ? JSON.stringify(body) : '';

            const options = {
                hostname: this.host,
                port: this.port,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(bodyData),
                },
                rejectUnauthorized: false, // Accept self-signed cert
            };

            console.log('[ApolloPairing] Request:', {
                method,
                url: `https://${this.host}:${this.port}${path}`,
                body: body
            });

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('[ApolloPairing] Response:', {
                        status: res.statusCode,
                        body: data
                    });

                    try {
                        const response = JSON.parse(data);

                        if (res.statusCode === 200 || res.statusCode === 201) {
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (e) {
                        // If not JSON, treat as success if 200
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            resolve({ success: true, data: data });
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    }
                });
            });

            req.on('error', (error) => {
                console.error('[ApolloPairing] Request error:', error);
                reject(error);
            });

            if (bodyData) {
                req.write(bodyData);
            }

            req.end();
        });
    }

    /**
     * Test connection to Apollo
     */
    async testConnection(): Promise<boolean> {
        console.log('[ApolloPairing] Testing connection...');

        try {
            await this.makeRequest('GET', '/api/apps');
            return true;
        } catch (error: any) {
            // 401 Unauthorized is expected and means connection works
            if (error.message.includes('401')) {
                console.log('[ApolloPairing] ✅ Connection OK (401 Unauthorized is expected)');
                return true;
            }

            console.error('[ApolloPairing] Connection test failed:', error.message);
            return false;
        }
    }
}

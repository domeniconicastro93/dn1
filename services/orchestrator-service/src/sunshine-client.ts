/**
 * Sunshine API Client
 * 
 * Communicates with Sunshine game streaming server to discover applications
 * and manage game streaming sessions.
 * 
 * Sunshine API Documentation:
 * - Web UI: https://localhost:47990 (HTTPS)
 * - API: http://localhost:47984 (HTTP) or https://localhost:47984 (HTTPS)
 * - Authentication: Basic Auth (username/password)
 */

import https from 'https';

interface SunshineConfig {
  url: string;
  port: number;
  username: string;
  password: string;
  useHttps: boolean;
  verifySsl: boolean;
  timeout: number;
}

export interface SunshineApplication {
  index: number;
  name: string;
  output: string;
  cmd: string;
  exe: string;
  workingDir?: string;
  env?: Record<string, string>;
  detached?: boolean;
  wait?: boolean;
  [key: string]: unknown;
}

export interface SunshineStatus {
  status: string;
  version?: string;
  hostname?: string;
  [key: string]: unknown;
}

export class SunshineConnectionError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'SunshineConnectionError';
    this.status = status;
    this.details = details;
  }
}

class SunshineClient {
  private config: SunshineConfig;
  private httpsAgent: https.Agent | undefined;

  constructor(config?: Partial<SunshineConfig>) {
    this.config = {
      url: process.env.SUNSHINE_URL || 'http://localhost',
      port: parseInt(process.env.SUNSHINE_PORT || '47984', 10),
      username: process.env.SUNSHINE_USERNAME || 'admin',
      password: process.env.SUNSHINE_PASSWORD || '',
      useHttps: process.env.SUNSHINE_USE_HTTPS === 'true',
      verifySsl: process.env.SUNSHINE_VERIFY_SSL !== 'false',
      timeout: parseInt(process.env.SUNSHINE_TIMEOUT || '10000', 10),
      ...config,
    };

    console.log('[SunshineClient] Config:', JSON.stringify(this.config, null, 2));

    if (!this.config.password) {
      throw new SunshineConnectionError(
        'SUNSHINE_PASSWORD is required for Sunshine API authentication'
      );
    }

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
    return `${protocol}://${this.config.url.replace(/^https?:\/\//, '')}:${this.config.port}`;
  }

  /**
   * Create Basic Auth header
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString(
      'base64'
    );
    return `Basic ${credentials}`;
  }

  /**
   * Make a request to Sunshine API using https.request (supports self-signed certs)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : require('http');

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          ...options.headers,
        },
        rejectUnauthorized: this.config.verifySsl,
        timeout: this.config.timeout,
      };

      const req = httpModule.request(requestOptions, (res: any) => {
        let data = '';

        res.on('data', (chunk: any) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              // Sunshine API may return data directly or wrapped in a response object
              resolve((jsonData?.data ?? jsonData) as T);
            } catch (error) {
              reject(new SunshineConnectionError(
                'Failed to parse Sunshine API response',
                res.statusCode,
                data
              ));
            }
          } else {
            let errorDetails: unknown;
            try {
              errorDetails = JSON.parse(data);
            } catch {
              errorDetails = data;
            }

            reject(new SunshineConnectionError(
              `Sunshine API request failed: ${res.statusMessage || 'Unknown error'}`,
              res.statusCode,
              errorDetails
            ));
          }
        });
      });

      req.on('error', (error: Error) => {
        if (error.message.includes('ECONNREFUSED')) {
          reject(new SunshineConnectionError(
            `Cannot connect to Sunshine at ${url}. Check that Sunshine is running and port ${this.config.port} is accessible.`
          ));
        } else {
          reject(new SunshineConnectionError(
            `Sunshine API request failed: ${error.message}`,
            0,
            error
          ));
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new SunshineConnectionError(
          `Sunshine API request timed out after ${this.config.timeout}ms`
        ));
      });

      // Send request body if present
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /**
   * Get Sunshine status
   */
  async getStatus(): Promise<SunshineStatus> {
    try {
      return await this.request<SunshineStatus>('/api/status');
    } catch (error) {
      // If status endpoint doesn't exist, try health endpoint
      if (error instanceof SunshineConnectionError && error.status === 404) {
        try {
          return await this.request<SunshineStatus>('/api/health');
        } catch {
          // Return a basic status if both endpoints fail
          return { status: 'unknown' };
        }
      }
      throw error;
    }
  }

  /**
   * Get all Sunshine applications
   */
  async getApplications(): Promise<SunshineApplication[]> {
    try {
      const apps = await this.request<SunshineApplication[]>('/api/apps');
      return Array.isArray(apps) ? apps : [];
    } catch (error) {
      // If /api/apps doesn't exist, try alternative endpoints
      if (error instanceof SunshineConnectionError && error.status === 404) {
        try {
          // Try alternative endpoint structure
          const response = await this.request<{ apps?: SunshineApplication[] }>('/api/applications');
          return Array.isArray(response?.apps) ? response.apps : [];
        } catch {
          // Return empty array if no applications endpoint exists
          return [];
        }
      }
      throw error;
    }
  }

  /**
   * Get a specific application by index
   */
  async getApplication(index: number): Promise<SunshineApplication | null> {
    try {
      return await this.request<SunshineApplication>(`/api/apps/${index}`);
    } catch (error) {
      if (error instanceof SunshineConnectionError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Test connectivity to Sunshine
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Use /api/apps instead of /api/status since Sunshine doesn't have a status endpoint
      await this.getApplications();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
let sunshineClientInstance: SunshineClient | null = null;

export function getSunshineClient(config?: Partial<SunshineConfig>): SunshineClient {
  if (!sunshineClientInstance) {
    sunshineClientInstance = new SunshineClient(config);
  }
  return sunshineClientInstance;
}

export function createSunshineClient(config?: Partial<SunshineConfig>): SunshineClient {
  return new SunshineClient(config);
}

export type { SunshineConfig };

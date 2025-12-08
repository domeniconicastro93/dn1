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
   * Make a request to Sunshine API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
          ...options.headers,
        },
        signal: controller.signal,
      };

      // Add HTTPS agent for self-signed certificates
      if (this.httpsAgent) {
        (fetchOptions as any).agent = this.httpsAgent;
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails: unknown;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }

        throw new SunshineConnectionError(
          `Sunshine API request failed: ${response.statusText}`,
          response.status,
          errorDetails
        );
      }

      // Sunshine API may return data directly or wrapped in a response object
      const data = await response.json() as any;
      return (data?.data ?? data) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SunshineConnectionError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new SunshineConnectionError(
          `Sunshine API request timed out after ${this.config.timeout}ms`
        );
      }

      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new SunshineConnectionError(
          `Cannot connect to Sunshine at ${url}. Check that Sunshine is running and port ${this.config.port} is accessible.`
        );
      }

      throw new SunshineConnectionError(
        `Sunshine API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }
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
      await this.getStatus();
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

/**
 * Sunshine Health Check
 * 
 * Validates Sunshine connectivity, port accessibility, and configuration.
 */

import { getSunshineClient, type SunshineStatus } from './sunshine-client';
import { SunshineConnectionError } from './sunshine-client';

export interface SunshineHealthCheck {
  connected: boolean;
  url: string;
  port: number;
  useHttps: boolean;
  status?: SunshineStatus;
  error?: string;
  diagnostics: {
    portAccessible: boolean;
    authenticationValid: boolean;
    apiResponding: boolean;
    details: string[];
  };
}

/**
 * Perform comprehensive health check on Sunshine
 */
export async function checkSunshineHealth(): Promise<SunshineHealthCheck> {
  const url = process.env.SUNSHINE_URL || 'http://localhost';
  const port = parseInt(process.env.SUNSHINE_PORT || '47984', 10);
  const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true';
  const protocol = useHttps ? 'https' : 'http';
  const fullUrl = `${protocol}://${url.replace(/^https?:\/\//, '')}:${port}`;

  const diagnostics = {
    portAccessible: false,
    authenticationValid: false,
    apiResponding: false,
    details: [] as string[],
  };

  let connected = false;
  let status: SunshineStatus | undefined;
  let error: string | undefined;

  try {
    const client = getSunshineClient();

    // Test 1: Basic connectivity
    diagnostics.details.push(`Testing connection to ${fullUrl}...`);
    const connectionTest = await client.testConnection();
    
    if (connectionTest.connected) {
      diagnostics.portAccessible = true;
      diagnostics.apiResponding = true;
      diagnostics.details.push('✓ Port is accessible');
      diagnostics.details.push('✓ API is responding');
      connected = true;
    } else {
      diagnostics.details.push(`✗ Connection failed: ${connectionTest.error}`);
      error = connectionTest.error;
    }

    // Test 2: Get status (validates authentication)
    if (connected) {
      try {
        status = await client.getStatus();
        diagnostics.authenticationValid = true;
        diagnostics.details.push('✓ Authentication successful');
        diagnostics.details.push(`✓ Sunshine status: ${status.status || 'ok'}`);
      } catch (err) {
        if (err instanceof SunshineConnectionError) {
          if (err.status === 401 || err.status === 403) {
            diagnostics.details.push('✗ Authentication failed - check SUNSHINE_USERNAME and SUNSHINE_PASSWORD');
            diagnostics.authenticationValid = false;
            error = 'Authentication failed';
          } else {
            diagnostics.details.push(`✗ Status check failed: ${err.message}`);
            error = err.message;
          }
        } else {
          diagnostics.details.push(`✗ Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          error = err instanceof Error ? err.message : 'Unknown error';
        }
      }
    }
  } catch (err) {
    if (err instanceof SunshineConnectionError) {
      error = err.message;
      diagnostics.details.push(`✗ ${err.message}`);
      
      if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
        diagnostics.portAccessible = false;
        diagnostics.details.push(`  → Check that Sunshine is running`);
        diagnostics.details.push(`  → Verify port ${port} is not blocked by firewall`);
        diagnostics.details.push(`  → Ensure ${protocol.toUpperCase()} is enabled in Sunshine config`);
      } else if (err.status === 401 || err.status === 403) {
        diagnostics.authenticationValid = false;
        diagnostics.details.push(`  → Verify SUNSHINE_USERNAME and SUNSHINE_PASSWORD are correct`);
      }
    } else {
      error = err instanceof Error ? err.message : 'Unknown error';
      diagnostics.details.push(`✗ Unexpected error: ${error}`);
    }
  }

  // Add configuration summary
  diagnostics.details.push('');
  diagnostics.details.push('Configuration:');
  diagnostics.details.push(`  URL: ${url}`);
  diagnostics.details.push(`  Port: ${port}`);
  diagnostics.details.push(`  Protocol: ${protocol.toUpperCase()}`);
  diagnostics.details.push(`  Username: ${process.env.SUNSHINE_USERNAME || 'admin'}`);
  diagnostics.details.push(`  Password: ${process.env.SUNSHINE_PASSWORD ? '***' : 'NOT SET'}`);

  return {
    connected,
    url,
    port,
    useHttps,
    status,
    error,
    diagnostics,
  };
}

/**
 * Quick connectivity test (lightweight)
 */
export async function quickSunshineTest(): Promise<boolean> {
  try {
    const client = getSunshineClient();
    const result = await client.testConnection();
    return result.connected;
  } catch {
    return false;
  }
}


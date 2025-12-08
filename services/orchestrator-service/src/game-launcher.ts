/**
 * Game Launcher Module
 * 
 * Handles launching Steam games on remote VMs via Sunshine API
 * 
 * Methods:
 * 1. Steam URI Protocol: steam://rungameid/<appId>
 * 2. Sunshine App Launch: Via Sunshine API
 */

import fetch from 'node-fetch';

/**
 * Launch a Steam game on the VM using Steam URI protocol
 * 
 * This sends a command to Sunshine to execute the Steam URI,
 * which launches the game through Steam's protocol handler.
 * 
 * @param vmHost - VM hostname or IP
 * @param steamAppId - Steam App ID (e.g., "730" for CS2)
 */
export async function launchGameOnVM(vmHost: string, steamAppId: string): Promise<void> {
    const sunshinePort = parseInt(process.env.SUNSHINE_PORT || '47984', 10);
    const sunshineUsername = process.env.SUNSHINE_USERNAME || 'admin';
    const sunshinePassword = process.env.SUNSHINE_PASSWORD || '';
    const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true';

    if (!sunshinePassword) {
        throw new Error('SUNSHINE_PASSWORD is required for game launching');
    }

    const protocol = useHttps ? 'https' : 'http';
    const baseUrl = `${protocol}://${vmHost}:${sunshinePort}`;

    // Create Steam URI
    const steamUri = `steam://rungameid/${steamAppId}`;

    console.log(`[GameLauncher] Launching game via Steam URI: ${steamUri}`);
    console.log(`[GameLauncher] Target VM: ${vmHost}`);

    try {
        // Method 1: Try Sunshine's app launch endpoint
        // This assumes Sunshine has a Steam launcher app configured
        const launchUrl = `${baseUrl}/api/launch`;

        const credentials = Buffer.from(`${sunshineUsername}:${sunshinePassword}`).toString('base64');

        const response = await fetch(launchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify({
                app: steamUri,
                // Alternative: use app index if Sunshine has Steam configured
                // appIndex: 0,
            }),
        });

        if (!response.ok) {
            // If Sunshine doesn't have a launch endpoint, try alternative method
            console.warn(`[GameLauncher] Sunshine launch endpoint failed: ${response.status}`);

            // Method 2: Use Windows PowerShell via WinRM (if configured)
            // This would require WinRM to be enabled on the VM
            // For now, we'll throw an error and document the requirement
            throw new Error(
                `Sunshine launch failed. Ensure Sunshine has a Steam launcher app configured, or enable WinRM on the VM.`
            );
        }

        const result = await response.json();
        console.log(`[GameLauncher] Game launched successfully:`, result);
    } catch (error) {
        console.error(`[GameLauncher] Error launching game:`, error);
        throw new Error(
            `Failed to launch game ${steamAppId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Launch a game using Sunshine's app index
 * 
 * This requires the game to be pre-configured in Sunshine's app list.
 * 
 * @param vmHost - VM hostname or IP
 * @param appIndex - Sunshine app index (0-based)
 */
export async function launchGameByIndex(vmHost: string, appIndex: number): Promise<void> {
    const sunshinePort = parseInt(process.env.SUNSHINE_PORT || '47984', 10);
    const sunshineUsername = process.env.SUNSHINE_USERNAME || 'admin';
    const sunshinePassword = process.env.SUNSHINE_PASSWORD || '';
    const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true';

    if (!sunshinePassword) {
        throw new Error('SUNSHINE_PASSWORD is required for game launching');
    }

    const protocol = useHttps ? 'https' : 'http';
    const baseUrl = `${protocol}://${vmHost}:${sunshinePort}`;

    console.log(`[GameLauncher] Launching game by index: ${appIndex}`);
    console.log(`[GameLauncher] Target VM: ${vmHost}`);

    try {
        const launchUrl = `${baseUrl}/api/launch`;

        const credentials = Buffer.from(`${sunshineUsername}:${sunshinePassword}`).toString('base64');

        const response = await fetch(launchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify({
                appIndex,
            }),
        });

        if (!response.ok) {
            throw new Error(`Sunshine launch failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[GameLauncher] Game launched successfully:`, result);
    } catch (error) {
        console.error(`[GameLauncher] Error launching game:`, error);
        throw new Error(
            `Failed to launch game at index ${appIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Stop a running game on the VM
 * 
 * @param vmHost - VM hostname or IP
 */
export async function stopGameOnVM(vmHost: string): Promise<void> {
    const sunshinePort = parseInt(process.env.SUNSHINE_PORT || '47984', 10);
    const sunshineUsername = process.env.SUNSHINE_USERNAME || 'admin';
    const sunshinePassword = process.env.SUNSHINE_PASSWORD || '';
    const useHttps = process.env.SUNSHINE_USE_HTTPS === 'true';

    if (!sunshinePassword) {
        throw new Error('SUNSHINE_PASSWORD is required');
    }

    const protocol = useHttps ? 'https' : 'http';
    const baseUrl = `${protocol}://${vmHost}:${sunshinePort}`;

    console.log(`[GameLauncher] Stopping game on VM: ${vmHost}`);

    try {
        const stopUrl = `${baseUrl}/api/stop`;

        const credentials = Buffer.from(`${sunshineUsername}:${sunshinePassword}`).toString('base64');

        const response = await fetch(stopUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
            },
        });

        if (!response.ok) {
            console.warn(`[GameLauncher] Stop endpoint failed: ${response.status}`);
            // Don't throw - stopping is best-effort
        }

        console.log(`[GameLauncher] Game stopped successfully`);
    } catch (error) {
        console.error(`[GameLauncher] Error stopping game:`, error);
        // Don't throw - stopping is best-effort
    }
}

/**
 * CONFIGURATION NOTES:
 * 
 * For Steam game launching to work, one of the following must be configured:
 * 
 * Option 1: Sunshine Steam Launcher App
 * ----------------------------------------
 * Add a "Steam Launcher" app to Sunshine's configuration:
 * 
 * Name: Steam Launcher
 * Command: cmd /c start "" "{app}"
 * Working Directory: C:\
 * 
 * Then pass steam://rungameid/<appId> as the {app} parameter.
 * 
 * Option 2: WinRM (Windows Remote Management)
 * --------------------------------------------
 * Enable WinRM on the VM and use PowerShell remoting:
 * 
 * Enable-PSRemoting -Force
 * Set-Item WSMan:\localhost\Client\TrustedHosts -Value "<orchestrator-ip>"
 * 
 * Then use Invoke-Command to execute:
 * Start-Process "steam://rungameid/<appId>"
 * 
 * Option 3: Pre-configured Sunshine Apps
 * ---------------------------------------
 * Add each game as a separate Sunshine app with its Steam URI:
 * 
 * Name: Counter-Strike 2
 * Command: cmd /c start "" "steam://rungameid/730"
 * 
 * Then launch by app index.
 */

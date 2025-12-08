import dotenv from 'dotenv';
import path from 'node:path';

// Load .env explicitly from the current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function resolveDefaultLibraryFolders(): string {
  if (process.platform === 'win32') {
    return path.join(
      process.env.STEAM_HOME || 'C:\\Program Files (x86)\\Steam',
      'steamapps',
      'libraryfolders.vdf'
    );
  }

  if (process.platform === 'darwin') {
    return path.join(
      process.env.HOME || '',
      'Library',
      'Application Support',
      'Steam',
      'steamapps',
      'libraryfolders.vdf'
    );
  }

  // linux
  return path.join(process.env.HOME || '', '.steam', 'steam', 'steamapps', 'libraryfolders.vdf');
}

export const STEAM_LIBRARY_FOLDERS_PATH =
  process.env.STEAM_LIBRARY_FOLDERS_PATH || resolveDefaultLibraryFolders();

export const STEAM_REGION = process.env.STEAM_VM_REGION || 'us-east-1';
export const STEAM_VM_ID = process.env.STEAM_VM_ID || 'steam-vm-default';
export const STEAM_VM_NAME = process.env.STEAM_VM_NAME || 'Steam Library VM';
export const STEAM_VM_STATUS =
  (process.env.STEAM_VM_STATUS as 'online' | 'sleeping' | 'offline') || 'online';

export const STEAM_WEB_LANGUAGE = process.env.STEAM_WEB_LANGUAGE || 'en';
export const SERVICE_PORT = parseInt(process.env.PORT || '3022', 10);
export const SERVICE_HOST = process.env.HOST || '0.0.0.0';

// Fallback to the known key if env is missing (for debugging reliability)
export const STEAM_API_KEY = process.env.STEAM_API_KEY || 'A7C258F4F68B663938D97D943F1F82D7';

console.log(`[Env] Loaded STEAM_API_KEY: ${STEAM_API_KEY ? 'Yes (Length: ' + STEAM_API_KEY.length + ')' : 'No'}`);

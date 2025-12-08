import 'server-only';
import type {
  SteamLibraryResponseDTO,
  SteamLibrarySyncResponseDTO,
} from '@strike/shared-types';

const SERVICE_BASE =
  process.env.STEAM_LIBRARY_SERVICE_URL || 'http://localhost:3022';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Steam library service returned ${response.status}`);
  }
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export async function fetchInstalledGames(): Promise<SteamLibraryResponseDTO> {
  const res = await fetch(`${SERVICE_BASE}/api/games/installed`, {
    cache: 'no-store',
  });
  return handleResponse<SteamLibraryResponseDTO>(res);
}

export async function fetchRawSteamLibrary() {
  const res = await fetch(`${SERVICE_BASE}/api/games/steam/library`, {
    cache: 'no-store',
  });
  return handleResponse(res);
}

export async function syncSteamLibrary(): Promise<SteamLibrarySyncResponseDTO> {
  const res = await fetch(`${SERVICE_BASE}/api/games/steam/sync`, {
    method: 'POST',
  });
  return handleResponse<SteamLibrarySyncResponseDTO>(res);
}


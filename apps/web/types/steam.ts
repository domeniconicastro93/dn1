export type SteamGameStatus = 'installed' | 'launching' | 'running' | 'needs_update';

export interface SteamLibraryEntry {
  steamAppId: string;
  gameId: string;
  title: string;
  artworkUrl: string;
  status: SteamGameStatus;
  installedAt?: string;
  playtimeMinutes?: number;
  lastPlayedAt?: string;
  lastLaunchedAt?: string;
  shortDescription?: string;
  genreTags?: string[];
}

export interface SteamLibrary {
  vmId: string;
  vmName: string;
  region: string;
  status: 'online' | 'sleeping' | 'offline';
  lastSyncedAt: string;
  entries: SteamLibraryEntry[];
}

export interface LaunchSteamGameResponse {
  vmId: string;
  vmName: string;
  steamAppId: string;
  sessionId: string;
  gameId: string;
  status: 'launching' | 'running';
  startedAt: string;
}


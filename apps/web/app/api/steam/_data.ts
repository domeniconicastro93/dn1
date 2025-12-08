type SteamGameStatus = 'installed' | 'launching' | 'running' | 'needs_update';

export interface SteamLibraryEntryRecord {
  steamAppId: string;
  gameId: string;
  title: string;
  artworkUrl: string;
  status: SteamGameStatus;
  installedAt: string;
  playtimeMinutes: number;
  lastPlayedAt?: string;
  lastLaunchedAt?: string;
  shortDescription?: string;
  genreTags: string[];
  sunshineAppId?: string;
}

interface SteamLibraryState {
  vmId: string;
  vmName: string;
  region: string;
  status: 'online' | 'sleeping' | 'offline';
  lastSyncedAt: string;
  entries: SteamLibraryEntryRecord[];
}

const steamLibraryState: SteamLibraryState = {
  vmId: 'vm-arcade-01',
  vmName: 'Arcade VM · RTX 4080',
  region: 'eu-central-1',
  status: 'online',
  lastSyncedAt: new Date().toISOString(),
  entries: [
    {
      steamAppId: '379720',
      gameId: 'steam-demo-doom',
      title: 'DOOM Eternal',
      artworkUrl:
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/782330/header.jpg',
      status: 'installed',
      installedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      playtimeMinutes: 532,
      lastPlayedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
      genreTags: ['Action', 'Shooter', 'Singleplayer'],
      shortDescription: 'idTech 7 · Ultra Nightmare preset ready',
      sunshineAppId: 'steam_doom_eternal',
    },
    {
      steamAppId: '239140',
      gameId: 'steam-demo-dyinglight',
      title: 'Dying Light',
      artworkUrl:
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/239140/header.jpg',
      status: 'needs_update',
      installedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      playtimeMinutes: 128,
      lastPlayedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      genreTags: ['Open World', 'Co-op', 'Parkour'],
      shortDescription: 'Update pending · Enable Steam Cloud saves',
      sunshineAppId: 'steam_dying_light',
    },
  ],
};

function touchSync() {
  steamLibraryState.lastSyncedAt = new Date().toISOString();
}

export function getSteamLibrarySnapshot() {
  return {
    ...steamLibraryState,
    entries: steamLibraryState.entries.map((entry) => ({ ...entry })),
  };
}

export function markSteamEntryStatus(steamAppId: string, status: SteamGameStatus) {
  const entry = steamLibraryState.entries.find((item) => item.steamAppId === steamAppId);
  if (!entry) {
    return null;
  }

  entry.status = status;
  if (status === 'launching' || status === 'running') {
    entry.lastLaunchedAt = new Date().toISOString();
  }
  touchSync();
  return entry;
}

export function findSteamEntry(steamAppId: string) {
  return steamLibraryState.entries.find((item) => item.steamAppId === steamAppId);
}


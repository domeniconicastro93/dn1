export interface SteamProfileDTO {
  steamId64: string;
  personaName?: string;
  avatar?: string;
  profileUrl?: string;
  countryCode?: string;
}

export interface SteamOwnedGameDTO {
  appId: string;
  title: string;
  playtimeMinutes?: number;
  iconUrl?: string;
  logoUrl?: string;
  hasCommunityVisibleStats?: boolean;
  lastUpdated?: string;
}

export type SteamUserLibraryStatus =
  | 'playable'
  | 'owned_not_installed'
  | 'installed_not_owned';

export interface SteamUserLibraryEntry {
  appId: string;
  steamAppId: string;
  sunshineAppId?: string;
  title: string;
  status: SteamUserLibraryStatus;
  owned: boolean;
  installed: boolean;
  metadata?: {
    playtimeMinutes?: number;
    headerImage?: string;
    genres?: string[];
    description?: string;
  };
}

export interface SteamOwnedLibraryResponse {
  steamId64: string;
  profile?: SteamProfileDTO;
  games: SteamOwnedGameDTO[];
  fetchedAt: string;
  cached: boolean;
}

export interface SteamUserLibraryResponse {
  steamId64: string;
  profile?: SteamProfileDTO;
  entries: SteamUserLibraryEntry[];
  counts: {
    playable: number;
    ownedNotInstalled: number;
    installedNotOwned: number;
  };
  fetchedAt: string;
}


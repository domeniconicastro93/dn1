import type {
  SteamInstalledGameDTO,
  SteamLibraryRawEntry,
  SteamLibraryResponseDTO,
  SteamLibrarySyncResponseDTO,
  SteamWebMetadata,
} from '@strike/shared-types';

export interface SteamLibraryFolder {
  path: string;
  contentId?: string;
}

export interface SteamLibraryData {
  folders: SteamLibraryFolder[];
  apps: SteamLibraryRawEntry[];
}

export interface SteamCacheState {
  library: SteamLibraryResponseDTO | null;
  raw: SteamLibraryData | null;
  metadata: Map<string, SteamWebMetadata>;
  syncing: boolean;
}

export type {
  SteamInstalledGameDTO,
  SteamLibraryRawEntry,
  SteamLibraryResponseDTO,
  SteamLibrarySyncResponseDTO,
  SteamWebMetadata,
};


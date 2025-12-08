import type { SteamLibraryResponseDTO, SteamLibrarySyncResponseDTO, SteamLibraryRawEntry } from './types';
export declare class SteamLibraryCache {
    private rawEntries;
    private games;
    private lastSyncedAt;
    private metadata;
    private syncing;
    sync(): Promise<SteamLibrarySyncResponseDTO>;
    getInstalledGames(): Promise<SteamLibraryResponseDTO>;
    getRawEntries(): SteamLibraryRawEntry[];
}

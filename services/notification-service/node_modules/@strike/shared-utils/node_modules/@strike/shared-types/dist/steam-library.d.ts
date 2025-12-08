export type SteamGameStatus = 'installed' | 'launching' | 'running' | 'needs_update';
export interface SteamExecutableMapping {
    appId: string;
    title: string;
    executablePath: string;
    sunshineAppId?: string;
}
export interface SteamWebMetadata {
    description?: string;
    headerImage?: string;
    genres?: string[];
    screenshots?: string[];
    lastUpdated?: string;
    playtimeMinutes?: number;
}
export interface SteamInstalledGameDTO {
    appId: string;
    title: string;
    installDir: string;
    installPath: string;
    sizeOnDisk?: number;
    lastUpdated?: string;
    status: SteamGameStatus;
    executablePath?: string;
    sunshineAppId?: string;
    metadata?: SteamWebMetadata;
}
export interface SteamLibraryResponseDTO {
    vmId: string;
    vmName: string;
    region?: string;
    status: 'online' | 'sleeping' | 'offline';
    lastSyncedAt: string;
    games: SteamInstalledGameDTO[];
}
export interface SteamLibraryRawEntry {
    appId: string;
    manifestPath: string;
    installDir?: string;
    name?: string;
    lastUpdated?: string;
    sizeOnDisk?: number;
    installPath?: string;
}
export interface SteamLibrarySyncResponseDTO {
    success: boolean;
    scanned: number;
    processed: number;
    lastSyncedAt: string;
}

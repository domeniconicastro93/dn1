import type { SteamWebMetadata } from './types';
export interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    img_logo_url: string;
}
export interface LibraryResult {
    games: OwnedGame[];
    privacyState: 'public' | 'private' | 'friendsOnly' | 'unknown';
}
export declare function getOwnedGames(steamId64: string): Promise<LibraryResult>;
export declare function fetchSteamMetadata(appId: string): Promise<SteamWebMetadata | undefined>;

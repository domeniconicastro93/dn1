interface SteamOpenIdValidation {
    valid: boolean;
    steamId64?: string;
    claimedId?: string;
}
export declare function buildSteamLoginUrl(state?: string): string;
export declare function validateSteamCallback(searchParams: URLSearchParams): Promise<SteamOpenIdValidation>;
export {};

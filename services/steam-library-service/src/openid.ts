import fetch from 'node-fetch';
import { STEAM_API_KEY } from './env';

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

interface SteamOpenIdValidation {
    valid: boolean;
    steamId64?: string;
    claimedId?: string;
}

function getRealm(): string {
    return process.env.STEAM_OPENID_REALM || 'http://localhost:3000';
}

function getReturnUrl(): string {
    return process.env.STEAM_LOGIN_RETURN_URL || `${getRealm().replace(/\/$/, '')}/api/steam/v1/callback`;
}

export function buildSteamLoginUrl(state?: string): string {
    const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': getReturnUrl() + (state ? `?state=${encodeURIComponent(state)}` : ''),
        'openid.realm': getRealm(),
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export async function validateSteamCallback(
    searchParams: URLSearchParams
): Promise<SteamOpenIdValidation> {
    console.log('[OPENID] Validating Steam callback with params:', Object.fromEntries(searchParams));

    // 1. Check for required fields
    const requiredFields = [
        'openid.sig',
        'openid.signed',
        'openid.op_endpoint',
        'openid.response_nonce',
        'openid.assoc_handle',
        'openid.claimed_id',
        'openid.identity',
        'openid.mode'
    ];

    for (const field of requiredFields) {
        if (!searchParams.has(field)) {
            console.error(`[OPENID] Missing required OpenID field: ${field}`);
            return { valid: false };
        }
    }

    if (searchParams.get('openid.mode') !== 'id_res') {
        console.error('[OPENID] Invalid openid.mode:', searchParams.get('openid.mode'));
        return { valid: false };
    }

    // 2. Validate signature with Steam
    const body = new URLSearchParams(searchParams);
    body.set('openid.mode', 'check_authentication');

    try {
        const response = await fetch(STEAM_OPENID_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        const text = await response.text();
        const isValid = text.includes('is_valid:true');

        if (!isValid) {
            console.error('[OPENID] Steam validation failed. Response:', text);
            return { valid: false };
        }

        // 3. Extract steamId64
        const claimedId = searchParams.get('openid.claimed_id') || '';
        // claimed_id format: https://steamcommunity.com/openid/id/76561198000000000
        const steamId64 = claimedId.replace('https://steamcommunity.com/openid/id/', '');

        if (!steamId64 || steamId64.length < 17 || !/^\d+$/.test(steamId64)) {
            console.error('[OPENID] Invalid steamId64 extracted:', steamId64);
            return { valid: false };
        }

        console.log('[OPENID] Steam validation successful. SteamID:', steamId64);

        return {
            valid: true,
            steamId64,
            claimedId,
        };
    } catch (error) {
        console.error('[OPENID] Steam OpenID validation error:', error);
        return { valid: false };
    }
}

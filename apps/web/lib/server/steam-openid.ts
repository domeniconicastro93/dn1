const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

interface SteamOpenIdValidation {
  valid: boolean;
  steamId64?: string;
  claimedId?: string;
}

function getRealm(): string {
  return (
    process.env.STEAM_OPENID_REALM ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  );
}

function getReturnUrl(): string {
  return (
    process.env.STEAM_LOGIN_RETURN_URL ||
    `${getRealm().replace(/\/$/, '')}/api/steam/v1/callback`
  );
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
  if (searchParams.get('openid.mode') !== 'id_res') {
    return { valid: false };
  }

  const body = new URLSearchParams(searchParams);
  body.set('openid.mode', 'check_authentication');

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
    return { valid: false };
  }

  const claimedId = searchParams.get('openid.claimed_id') || '';
  const steamId64 = claimedId.split('/').pop();

  return {
    valid: Boolean(steamId64),
    steamId64: steamId64 || undefined,
    claimedId,
  };
}

export function ensureSteamKey(): string {
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) {
    throw new Error('STEAM_WEB_API_KEY is required to use the Steam Web API.');
  }
  return key;
}


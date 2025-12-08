/**
 * Steam XML Privacy Checker
 * 
 * This module provides AUTHORITATIVE privacy checking using Steam's XML profile
 * This is the ONLY reliable way to determine if a profile is truly private
 */

import fetch from 'node-fetch';

/**
 * Fetch and parse Steam XML profile to determine AUTHORITATIVE privacy state
 * 
 * @param steamId64 - The user's 64-bit Steam ID
 * @returns 'public' | 'private' | 'unknown'
 */
export async function fetchSteamXMLPrivacy(steamId64: string): Promise<'public' | 'private' | 'unknown'> {
    const DEBUG_STEAM = process.env.DEBUG_STEAM === 'true' || process.env.STEAM_DEBUG_LOG === 'true';

    try {
        const xmlUrl = `https://steamcommunity.com/profiles/${steamId64}?xml=1`;

        if (DEBUG_STEAM) {
            console.log('[SteamXML] 🔍 Fetching authoritative privacy from:', xmlUrl);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(xmlUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Strike-Gaming-Cloud/1.0',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('[SteamXML] ❌ Failed to fetch XML:', response.status);
            return 'unknown';
        }

        const xmlText = await response.text();

        if (DEBUG_STEAM) {
            console.log('[SteamXML] 📄 XML Response (first 800 chars):', xmlText.substring(0, 800));
        }

        // Parse privacy state from XML
        // Look for: <privacyState>public</privacyState>
        // Or: <communityvisibilitystate>3</communityvisibilitystate>

        const privacyStateMatch = xmlText.match(/<privacyState>([^<]+)<\/privacyState>/i);
        const visibilityStateMatch = xmlText.match(/<communityvisibilitystate>(\d+)<\/communityvisibilitystate>/i);
        const visibilityMatch = xmlText.match(/<visibilityState>(\d+)<\/visibilityState>/i);

        if (DEBUG_STEAM) {
            console.log('[SteamXML] 🔍 privacyState:', privacyStateMatch?.[1]);
            console.log('[SteamXML] 🔍 communityvisibilitystate:', visibilityStateMatch?.[1]);
            console.log('[SteamXML] 🔍 visibilityState:', visibilityMatch?.[1]);
        }

        // Check privacyState first (most explicit)
        if (privacyStateMatch) {
            const state = privacyStateMatch[1].toLowerCase();
            if (state === 'public') {
                console.log('[SteamXML] ✅ Profile is PUBLIC (via privacyState)');
                return 'public';
            }
            if (state === 'private' || state === 'friendsonly') {
                console.log('[SteamXML] ❌ Profile is PRIVATE (via privacyState)');
                return 'private';
            }
        }

        // Check communityvisibilitystate (numeric)
        if (visibilityStateMatch) {
            const state = parseInt(visibilityStateMatch[1]);
            if (state === 3) {
                console.log('[SteamXML] ✅ Profile is PUBLIC (via communityvisibilitystate=3)');
                return 'public';
            }
            if (state === 1 || state === 2) {
                console.log('[SteamXML] ❌ Profile is PRIVATE (via communityvisibilitystate=', state, ')');
                return 'private';
            }
        }

        // Check visibilityState
        if (visibilityMatch) {
            const state = parseInt(visibilityMatch[1]);
            if (state === 3) {
                console.log('[SteamXML] ✅ Profile is PUBLIC (via visibilityState=3)');
                return 'public';
            }
            if (state === 1 || state === 2) {
                console.log('[SteamXML] ❌ Profile is PRIVATE (via visibilityState=', state, ')');
                return 'private';
            }
        }

        console.warn('[SteamXML] ⚠️ Could not determine privacy state from XML');
        return 'unknown';

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error('[SteamXML] ❌ Request timeout');
        } else {
            console.error('[SteamXML] ❌ Error fetching XML:', error.message);
        }
        return 'unknown';
    }
}

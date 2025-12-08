'use client';

import { useEffect, useState } from 'react';

interface SteamLinkState {
  loading: boolean;
  linked: boolean;
  requiresAuth: boolean;
  steamId64?: string;
}

export function useSteamLinkStatus() {
  const [state, setState] = useState<SteamLinkState>({
    loading: true,
    linked: false,
    requiresAuth: false,
  });

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch('/api/steam/status', { cache: 'no-store' });
        const data = await res.json();
        if (!canceled) {
          setState({
            loading: false,
            linked: Boolean(data.linked),
            requiresAuth: Boolean(data.requiresAuth),
            steamId64: data.steamId64,
          });
        }
      } catch {
        if (!canceled) {
          setState({ loading: false, linked: false, requiresAuth: false });
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return state;
}


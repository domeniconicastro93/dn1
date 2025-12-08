'use client';

import { useEffect, useState } from 'react';
import type { SteamUserLibraryResponse } from '@strike/shared-types';

interface SteamLibraryState {
  loading: boolean;
  library: SteamUserLibraryResponse | null;
  error?: string;
}

export function useSteamLibrary(enabled: boolean) {
  const [state, setState] = useState<SteamLibraryState>({
    loading: enabled,
    library: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, library: null });
      return;
    }
    let canceled = false;
    (async () => {
      setState({ loading: true, library: null });
      try {
        const res = await fetch('/api/user/library', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to load Steam library');
        }
        const data = (await res.json()) as SteamUserLibraryResponse;
        if (!canceled) {
          setState({ loading: false, library: data });
        }
      } catch (error) {
        if (!canceled) {
          setState({
            loading: false,
            library: null,
            error: error instanceof Error ? error.message : 'Unable to load library',
          });
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [enabled]);

  return state;
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserDTO } from '@strike/shared-types';

interface UseStrikeSessionReturn {
  authenticated: boolean;
  user: UserDTO | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Client hook for managing Strike authentication session
 * 
 * Provides:
 * - User profile data
 * - Authentication state
 * - Login/logout functions
 * - Automatic session refresh
 */
export function useStrikeSession(): UseStrikeSessionReturn {
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile from API
   * Uses the Next.js API route /api/auth/session which proxies to backend
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/v1/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status}`);
      }

      const data = await response.json();

      // Handle session format: { authenticated, user, roles }
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Don't set error state for session check failures (just logged out)
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login function
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/auth/v1/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = data.error || data.message || 'Login failed';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        // Refresh user profile after successful login
        await fetchUserProfile();

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile]
  );

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/v1/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      window.dispatchEvent(new Event('strike:auth:update'));
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error during logout:', err);
      // Clear local state even if API call fails
      setUser(null);
      router.push('/');
    }
  }, [router]);

  /**
   * Refresh user profile
   */
  const refresh = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch user profile on mount and listen for updates
  useEffect(() => {
    fetchUserProfile();

    const handleAuthUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('strike:auth:update', handleAuthUpdate);
    return () => {
      window.removeEventListener('strike:auth:update', handleAuthUpdate);
    };
  }, [fetchUserProfile]);

  return {
    authenticated: user !== null,
    user,
    loading,
    error,
    login,
    logout,
    refresh,
  };
}

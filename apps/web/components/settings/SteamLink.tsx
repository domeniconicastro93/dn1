
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStrikeSession } from '@/hooks/useStrikeSession';
import { useRouter } from 'next/navigation';

export function SteamLink() {
    const { user, refresh } = useStrikeSession();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLinkSteam = async () => {
        setIsLoading(true);
        try {
            // Redirect to Steam auth endpoint
            // The backend will handle the redirect to Steam
            window.location.href = '/api/steam/v1/auth';
        } catch (error) {
            console.error('Failed to initiate Steam linking:', error);
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Steam Integration</h3>

            {user.steamId64 ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#171a21] rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.979 0C5.357 0 0 5.377 0 12.02c0 5.24 3.42 9.66 8.23 11.28l.75-2.88c-.62-.08-1.22-.24-1.78-.49l-2.07 2.07c-.31.31-.82.31-1.13 0-.31-.31-.31-.82 0-1.13l2.05-2.05A7.88 7.88 0 0 1 4.02 12.02c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8c-.6 0-1.18-.06-1.74-.18l-1.38 5.28c1.01.18 2.05.28 3.12.28 6.62 0 11.98-5.38 11.98-12.02S18.6 0 11.98 0zM8.5 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7.5 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-medium">Steam Connected</p>
                            <p className="text-sm text-gray-400">ID: {user.steamId64}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="text-green-400 border-green-400/20 bg-green-400/10 hover:bg-green-400/20">
                        Connected
                    </Button>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <p className="text-gray-300">Link your Steam account to sync your game library.</p>
                    <Button
                        onClick={handleLinkSteam}
                        disabled={isLoading}
                        className="bg-[#171a21] hover:bg-[#2a2d33] text-white flex items-center gap-2"
                    >
                        {isLoading ? 'Connecting...' : 'Link Steam Account'}
                    </Button>
                </div>
            )}
        </div>
    );
}

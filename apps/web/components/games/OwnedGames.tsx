
'use client';

import { useEffect, useState } from 'react';
import { useStrikeSession } from '@/hooks/useStrikeSession';
import { SteamLink } from '@/components/settings/SteamLink';

interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    img_logo_url: string;
}

interface LibraryResponse {
    ownedGames: OwnedGame[];
    totalCount: number;
    privacyState: 'public' | 'private' | 'friendsOnly' | 'unknown';
}

export function OwnedGames() {
    const { authenticated, user } = useStrikeSession();
    const [library, setLibrary] = useState<LibraryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authenticated && user?.steamId64) {
            fetchLibrary();
        }
    }, [authenticated, user?.steamId64]);

    const fetchLibrary = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/library', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch library');
            const data = await res.json();
            setLibrary(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load Steam library');
        } finally {
            setLoading(false);
        }
    };

    if (!authenticated) return null;

    if (!user?.steamId64) {
        return (
            <div className="container mx-auto px-5 md:px-20 py-8">
                <h2 className="text-2xl font-bold text-white mb-6">My Library</h2>
                <SteamLink />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto px-5 md:px-20 py-8">
                <h2 className="text-2xl font-bold text-white mb-6">My Library</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-5 md:px-20 py-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200">
                    {error}
                </div>
            </div>
        );
    }

    if (library?.privacyState === 'private' || library?.privacyState === 'friendsOnly' || library?.privacyState === 'unknown') {
        return (
            <div className="container mx-auto px-5 md:px-20 py-8">
                <h2 className="text-2xl font-bold text-white mb-6">My Library</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">Steam Profile Private</h3>
                    <p className="text-yellow-200/80 mb-4">
                        Your Steam profile is set to private. We cannot fetch your games.
                        Please change your privacy settings to Public to see your library here.
                    </p>
                    <a
                        href="https://steamcommunity.com/my/edit/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white underline hover:text-yellow-200"
                    >
                        Edit Steam Privacy Settings
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-5 md:px-20 py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                    My Library <span className="text-gray-500 text-lg font-normal">({library?.totalCount || 0})</span>
                </h2>
                <button
                    onClick={fetchLibrary}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Refresh
                </button>
            </div>

            {library?.ownedGames.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-lg">
                    <p className="text-gray-400">No games found in your Steam library.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {library?.ownedGames.map((game) => (
                        <div key={game.appid} className="group relative bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors">
                            <div className="aspect-[16/9] relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`}
                                    alt={game.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-game.jpg';
                                    }}
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="text-white font-medium text-sm truncate" title={game.name}>
                                    {game.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {Math.round(game.playtime_forever / 60)} hrs played
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

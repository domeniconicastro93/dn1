import React from 'react';

export function StreamerDashboard() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Streamer Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Stream Key</h3>
                    <div className="bg-black p-3 rounded font-mono text-sm text-gray-400">
                        sk_live_********************
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Stream Status</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="text-gray-300">Offline</span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Viewer Count</h3>
                    <div className="text-4xl font-bold">0</div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';

export function LiveStreamInteractions({ streamId }: { streamId?: string }) {
    return (
        <div className="flex gap-2 items-center">
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                Follow
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                Subscribe
            </button>
        </div>
    );
}

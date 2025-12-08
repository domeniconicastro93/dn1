import React from 'react';

export function LiveStreamChat({ streamId }: { streamId?: string }) {
    return (
        <div className="p-4 bg-gray-900 text-white h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <div className="text-gray-400 text-sm text-center mt-4">Welcome to the chat!</div>
            </div>
            <div className="mt-2">
                <input
                    type="text"
                    placeholder="Send a message..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    disabled
                />
            </div>
        </div>
    );
}

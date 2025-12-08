'use client';

import { AlertTriangle, WifiOff, Server, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ErrorType =
    | 'vm_unreachable'
    | 'sunshine_offline'
    | 'session_expired'
    | 'stream_dropped'
    | 'connection_failed'
    | 'unknown';

interface ErrorOverlayProps {
    type: ErrorType;
    message?: string;
    details?: string;
    onRetry?: () => void;
    onExit: () => void;
}

const ERROR_CONFIG = {
    vm_unreachable: {
        icon: Server,
        title: 'VM Unreachable',
        defaultMessage: 'Cannot connect to cloud server',
        color: 'text-red-500',
        showRetry: true,
    },
    sunshine_offline: {
        icon: WifiOff,
        title: 'Streaming Service Offline',
        defaultMessage: 'The game server is not responding',
        color: 'text-orange-500',
        showRetry: true,
    },
    session_expired: {
        icon: Clock,
        title: 'Session Expired',
        defaultMessage: 'Your gaming session has ended',
        color: 'text-yellow-500',
        showRetry: false,
    },
    stream_dropped: {
        icon: WifiOff,
        title: 'Stream Disconnected',
        defaultMessage: 'Connection to the game stream was lost',
        color: 'text-red-500',
        showRetry: true,
    },
    connection_failed: {
        icon: XCircle,
        title: 'Connection Failed',
        defaultMessage: 'Unable to establish connection',
        color: 'text-red-500',
        showRetry: true,
    },
    unknown: {
        icon: AlertTriangle,
        title: 'Error',
        defaultMessage: 'An unexpected error occurred',
        color: 'text-red-500',
        showRetry: true,
    },
};

export function ErrorOverlay({
    type,
    message,
    details,
    onRetry,
    onExit,
}: ErrorOverlayProps) {
    const config = ERROR_CONFIG[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`mb-6 ${config.color}`}>
                        <Icon className="w-16 h-16" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-3">
                        {config.title}
                    </h2>

                    {/* Message */}
                    <p className="text-gray-300 mb-2">
                        {message || config.defaultMessage}
                    </p>

                    {/* Details */}
                    {details && (
                        <p className="text-gray-500 text-sm mb-6">
                            {details}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 w-full">
                        {config.showRetry && onRetry && (
                            <Button
                                onClick={onRetry}
                                className="flex-1 bg-white text-black hover:bg-gray-200"
                            >
                                Retry
                            </Button>
                        )}
                        <Button
                            onClick={onExit}
                            variant="outline"
                            className={`flex-1 border-white/20 text-white hover:bg-white/10 ${!config.showRetry ? 'w-full' : ''
                                }`}
                        >
                            {config.showRetry ? 'Exit' : 'Back to Games'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

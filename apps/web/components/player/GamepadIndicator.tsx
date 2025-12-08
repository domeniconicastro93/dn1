'use client';

import { Gamepad2 } from 'lucide-react';
import type { GamepadState } from '@/hooks/useGamepad';

interface GamepadIndicatorProps {
    gamepads: GamepadState[];
    className?: string;
}

export function GamepadIndicator({ gamepads, className = '' }: GamepadIndicatorProps) {
    const hasGamepad = gamepads.length > 0;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                <Gamepad2
                    className={`w-5 h-5 transition-colors ${hasGamepad ? 'text-green-400' : 'text-gray-500'
                        }`}
                />
                {hasGamepad && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
            </div>
            <span className={`text-sm font-medium transition-colors ${hasGamepad ? 'text-white' : 'text-gray-500'
                }`}>
                {hasGamepad ? `${gamepads.length} Controller${gamepads.length > 1 ? 's' : ''}` : 'No Controller'}
            </span>
        </div>
    );
}

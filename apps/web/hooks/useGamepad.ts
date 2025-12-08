'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface GamepadState {
    id: string;
    index: number;
    connected: boolean;
    buttons: boolean[];
    axes: number[];
    timestamp: number;
}

export interface GamepadInputEvent {
    type: 'button' | 'axis';
    index: number;
    value: number;
    timestamp: number;
}

/**
 * useGamepad Hook
 * 
 * Monitors connected gamepads and provides input events
 */
export function useGamepad(onInput?: (gamepadIndex: number, event: GamepadInputEvent) => void) {
    const [gamepads, setGamepads] = useState<GamepadState[]>([]);
    const previousStateRef = useRef<Map<number, GamepadState>>(new Map());
    const animationFrameRef = useRef<number | null>(null);

    /**
     * Convert Gamepad to GamepadState
     */
    const toGamepadState = useCallback((gamepad: Gamepad): GamepadState => {
        return {
            id: gamepad.id,
            index: gamepad.index,
            connected: gamepad.connected,
            buttons: gamepad.buttons.map(b => b.pressed),
            axes: gamepad.axes.map(a => a),
            timestamp: gamepad.timestamp,
        };
    }, []);

    /**
     * Detect input changes and emit events
     */
    const detectInputChanges = useCallback((current: GamepadState, previous?: GamepadState) => {
        if (!onInput || !previous) return;

        // Check button changes
        current.buttons.forEach((pressed, index) => {
            if (pressed !== previous.buttons[index]) {
                onInput(current.index, {
                    type: 'button',
                    index,
                    value: pressed ? 1 : 0,
                    timestamp: current.timestamp,
                });
            }
        });

        // Check axis changes (with deadzone)
        const DEADZONE = 0.1;
        current.axes.forEach((value, index) => {
            const prevValue = previous.axes[index] || 0;
            const diff = Math.abs(value - prevValue);

            if (diff > DEADZONE) {
                onInput(current.index, {
                    type: 'axis',
                    index,
                    value,
                    timestamp: current.timestamp,
                });
            }
        });
    }, [onInput]);

    /**
     * Poll gamepads
     */
    const pollGamepads = useCallback(() => {
        const gamepadsArray = navigator.getGamepads();
        const connectedGamepads: GamepadState[] = [];
        const newPreviousState = new Map<number, GamepadState>();

        for (let i = 0; i < gamepadsArray.length; i++) {
            const gamepad = gamepadsArray[i];
            if (gamepad && gamepad.connected) {
                const state = toGamepadState(gamepad);
                connectedGamepads.push(state);

                // Detect changes
                const previousState = previousStateRef.current.get(gamepad.index);
                detectInputChanges(state, previousState);

                // Store current state for next comparison
                newPreviousState.set(gamepad.index, state);
            }
        }

        previousStateRef.current = newPreviousState;
        setGamepads(connectedGamepads);

        // Continue polling
        animationFrameRef.current = requestAnimationFrame(pollGamepads);
    }, [toGamepadState, detectInputChanges]);

    /**
     * Handle gamepad connected
     */
    const handleGamepadConnected = useCallback((e: GamepadEvent) => {
        console.log('[useGamepad] Gamepad connected:', e.gamepad.id);
        pollGamepads();
    }, [pollGamepads]);

    /**
     * Handle gamepad disconnected
     */
    const handleGamepadDisconnected = useCallback((e: GamepadEvent) => {
        console.log('[useGamepad] Gamepad disconnected:', e.gamepad.id);
        previousStateRef.current.delete(e.gamepad.index);
        pollGamepads();
    }, [pollGamepads]);

    /**
     * Initialize gamepad monitoring
     */
    useEffect(() => {
        // Check for already connected gamepads
        const gamepadsArray = navigator.getGamepads();
        const hasConnected = Array.from(gamepadsArray).some(g => g && g.connected);

        if (hasConnected) {
            pollGamepads();
        }

        // Listen for gamepad events
        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

        return () => {
            window.removeEventListener('gamepadconnected', handleGamepadConnected);
            window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handleGamepadConnected, handleGamepadDisconnected, pollGamepads]);

    return {
        gamepads,
        hasGamepad: gamepads.length > 0,
    };
}

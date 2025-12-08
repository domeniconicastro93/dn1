
import React, { useEffect, useRef, useState } from 'react';
import { MoonlightSession, StreamSettings } from './moonlight-core/session';
import { getSupportedVideoFormats } from './moonlight-core/video';

interface MoonlightClientProps {
    host: string;
    port: number;
    udpPorts: number[];
    sessionId: string;
    gameId: string;
    appId: string;
    useHttps: boolean;
}

export default function MoonlightClient({ host, port, udpPorts, sessionId, gameId, appId, useHttps }: MoonlightClientProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const [error, setError] = useState<string | null>(null);
    const [debugLines, setDebugLines] = useState<string[]>([]);
    const sessionRef = useRef<MoonlightSession | null>(null);

    useEffect(() => {
        let mounted = true;

        const startStream = async () => {
            try {
                setStatus('Checking video support...');
                const supportedFormats = await getSupportedVideoFormats();

                if (!mounted) return;

                const settings: StreamSettings = {
                    videoSize: 'native',
                    fps: 60,
                    bitrate: 10000, // 10 Mbps
                    packetSize: 1024,
                    videoSampleQueueSize: 5,
                    playAudioLocal: false,
                    audioSampleQueueSize: 10,
                    mouseScrollMode: 'highres',
                    controllerConfig: { invertAB: false, invertXY: false }
                };

                setStatus('Connecting to Sunshine...');
                const session = new MoonlightSession(
                    host,
                    port,
                    appId,
                    useHttps,
                    settings,
                    supportedFormats,
                    [window.innerWidth, window.innerHeight]
                );

                sessionRef.current = session;

                session.addInfoListener((e: any) => {
                    const detail = e.detail;
                    if (detail.type === 'addDebugLine') {
                        setDebugLines(prev => [...prev.slice(-19), detail.line]);
                    } else if (detail.type === 'error') {
                        setError(detail.message || 'Unknown error');
                        setStatus('Error');
                    } else if (detail.type === 'connectionStatus') {
                        setStatus(`Status: ${detail.status}`);
                    } else if (detail.type === 'connectionComplete') {
                        setStatus('Connected');
                    }
                });

                // Attach media stream to video element
                if (videoRef.current) {
                    videoRef.current.srcObject = session.getMediaStream();
                }

                // Input handling
                const input = session.getInput();
                const handleKeyDown = (e: KeyboardEvent) => input.onKeyDown(e);
                const handleKeyUp = (e: KeyboardEvent) => input.onKeyUp(e);
                const handleMouseDown = (e: MouseEvent) => {
                    if (videoRef.current) {
                        input.onMouseDown(e, videoRef.current.getBoundingClientRect());
                    }
                };
                const handleMouseUp = (e: MouseEvent) => input.onMouseUp(e);
                const handleMouseMove = (e: MouseEvent) => {
                    if (videoRef.current) {
                        input.onMouseMove(e, videoRef.current.getBoundingClientRect());
                    }
                };
                const handleWheel = (e: WheelEvent) => {
                    e.preventDefault();
                    input.onMouseWheel(e);
                };
                const handleContextMenu = (e: MouseEvent) => e.preventDefault();

                window.addEventListener('keydown', handleKeyDown);
                window.addEventListener('keyup', handleKeyUp);

                // Attach mouse listeners to the video container or window depending on capture mode
                // For now, attaching to window for simplicity but checking target might be better
                const container = videoRef.current;
                if (container) {
                    container.addEventListener('mousedown', handleMouseDown);
                    window.addEventListener('mouseup', handleMouseUp);
                    window.addEventListener('mousemove', handleMouseMove);
                    container.addEventListener('wheel', handleWheel, { passive: false });
                    container.addEventListener('contextmenu', handleContextMenu);
                }

                // Gamepad polling loop
                const gamepadInterval = setInterval(() => {
                    input.onGamepadUpdate();
                }, 16); // ~60hz

                return () => {
                    window.removeEventListener('keydown', handleKeyDown);
                    window.removeEventListener('keyup', handleKeyUp);
                    if (container) {
                        container.removeEventListener('mousedown', handleMouseDown);
                        window.removeEventListener('mouseup', handleMouseUp);
                        window.removeEventListener('mousemove', handleMouseMove);
                        container.removeEventListener('wheel', handleWheel);
                        container.removeEventListener('contextmenu', handleContextMenu);
                    }
                    clearInterval(gamepadInterval);
                };

            } catch (err: any) {
                console.error("Stream start failed", err);
                setError(err.message);
                setStatus('Failed');
            }
        };

        // Connection timeout
        const timeoutId = setTimeout(() => {
            if (sessionRef.current && status !== 'Connected' && !error) {
                setError('Connection timed out. Is Sunshine running and reachable?');
                setStatus('Timeout');
            }
        }, 10000);

        const cleanupPromise = startStream();

        return () => {
            clearTimeout(timeoutId);
            mounted = false;
            sessionRef.current?.close();
        };
    }, [host, port, appId, useHttps]);

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                style={{ maxHeight: '100vh', maxWidth: '100vw' }}
            />

            {(status !== 'Connected' || error) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
                    <h2 className="text-2xl font-bold mb-4">Cloud Gaming Session</h2>
                    {error ? (
                        <div className="text-red-500 bg-red-900/20 p-4 rounded border border-red-500 mb-4">
                            Error: {error}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-lg">{status}</p>
                        </div>
                    )}

                    <div className="mt-8 p-4 bg-gray-900 rounded max-w-2xl w-full font-mono text-xs text-gray-400 h-48 overflow-y-auto">
                        {debugLines.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

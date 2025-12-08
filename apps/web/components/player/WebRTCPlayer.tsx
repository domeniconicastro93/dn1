'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Maximize, Minimize, Wifi, WifiOff, X, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGamepad, type GamepadInputEvent } from '@/hooks/useGamepad';
import { GamepadIndicator } from './GamepadIndicator';
import { ErrorOverlay, type ErrorType } from './ErrorOverlay';
import { StatsDisplay } from './StatsDisplay';

interface WebRTCPlayerProps {
    sessionId: string;
}

interface SessionDetails {
    sessionId: string;
    state: string;
    sunshineHost: string;
    sunshinePort: number; // PHASE 11 FINAL: Web/API port for WebRTC signaling
    sunshineStreamPort: number;
    appIndex: number; // PHASE 11 FINAL: App index in Sunshine (1 = Steam)
    webrtc: {
        iceServers: Array<{ urls: string | string[] }>;
    };
    appId: string;
    steamAppId?: string;
    createdAt: string;
    duration?: number;
    error?: {
        code: string;
        message: string;
        details?: string;
    };
    health?: {
        vmReachable: boolean;
        sunshineReachable: boolean;
        streamActive: boolean;
    };
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export function WebRTCPlayer({ sessionId }: WebRTCPlayerProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statusPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [session, setSession] = useState<SessionDetails | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [latency, setLatency] = useState<number>(0);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [error, setError] = useState<{ type: ErrorType; message?: string; details?: string } | null>(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [duration, setDuration] = useState(0);

    const MAX_RECONNECT_ATTEMPTS = 5;

    /**
     * Handle gamepad input
     */
    const handleGamepadInput = useCallback((gamepadIndex: number, event: GamepadInputEvent) => {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
            return;
        }

        try {
            const message = JSON.stringify({
                type: 'gamepad',
                gamepadIndex,
                event,
            });

            dataChannelRef.current.send(message);
            console.log('[WebRTCPlayer] Sent gamepad input:', event.type, event.index, event.value);
        } catch (err) {
            console.error('[WebRTCPlayer] Error sending gamepad input:', err);
        }
    }, []);

    // Initialize gamepad hook
    const { gamepads, hasGamepad } = useGamepad(handleGamepadInput);

    /**
     * Fetch session details from API
     */
    const fetchSessionDetails = async () => {
        try {
            console.log('[WebRTCPlayer] Fetching session details:', sessionId);

            const res = await fetch(`/api/play/status/${sessionId}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('SESSION_NOT_FOUND');
                } else if (res.status === 401 || res.status === 403) {
                    throw new Error('SESSION_UNAUTHORIZED');
                }
                throw new Error('Failed to fetch session details');
            }

            const response = await res.json();
            const sessionData = response.data;

            console.log('[WebRTCPlayer] Session details:', sessionData);

            // Check session state
            if (sessionData.state === 'ENDED') {
                setError({
                    type: 'session_expired',
                    message: 'Your gaming session has ended',
                    details: `Duration: ${Math.floor((sessionData.duration || 0) / 60)} minutes`,
                });
                setConnectionState('error');
                return null;
            }

            if (sessionData.state === 'ERROR') {
                setError({
                    type: 'unknown',
                    message: sessionData.error?.message || 'Session encountered an error',
                    details: sessionData.error?.details,
                });
                setConnectionState('error');
                return null;
            }

            // Check health
            if (sessionData.health) {
                if (!sessionData.health.vmReachable) {
                    setError({
                        type: 'vm_unreachable',
                        message: 'Cannot connect to cloud server',
                    });
                    setConnectionState('error');
                    return null;
                }

                if (!sessionData.health.sunshineReachable) {
                    setError({
                        type: 'sunshine_offline',
                        message: 'Streaming service is not responding',
                    });
                    setConnectionState('error');
                    return null;
                }
            }

            setSession(sessionData);
            return sessionData;
        } catch (err) {
            console.error('[WebRTCPlayer] Error fetching session:', err);

            if (err instanceof Error) {
                if (err.message === 'SESSION_NOT_FOUND') {
                    setError({
                        type: 'session_expired',
                        message: 'Session not found',
                    });
                } else if (err.message === 'SESSION_UNAUTHORIZED') {
                    setError({
                        type: 'unknown',
                        message: 'Unauthorized access to session',
                    });
                } else {
                    setError({
                        type: 'connection_failed',
                        message: 'Failed to load session details',
                    });
                }
            }

            setConnectionState('error');
            return null;
        }
    };

    /**
     * Start status polling
     */
    const startStatusPolling = useCallback(() => {
        if (statusPollIntervalRef.current) {
            clearInterval(statusPollIntervalRef.current);
        }

        statusPollIntervalRef.current = setInterval(async () => {
            try {
                const sessionData = await fetchSessionDetails();
                if (sessionData && sessionData.duration !== undefined) {
                    setDuration(sessionData.duration);
                }
            } catch (err) {
                console.error('[WebRTCPlayer] Status poll error:', err);
            }
        }, 5000); // Poll every 5 seconds

        console.log('[WebRTCPlayer] Started status polling');
    }, [sessionId]);

    /**
     * Stop status polling
     */
    const stopStatusPolling = useCallback(() => {
        if (statusPollIntervalRef.current) {
            clearInterval(statusPollIntervalRef.current);
            statusPollIntervalRef.current = null;
            console.log('[WebRTCPlayer] Stopped status polling');
        }
    }, []);

    /**
     * Initialize WebRTC connection
     * PHASE 11 FINAL: Connects to Sunshine via WebRTC signaling
     */
    const initializeWebRTC = async (sessionData: SessionDetails) => {
        try {
            console.log('[WebRTCPlayer] ========================================');
            console.log('[WebRTCPlayer] INITIALIZING WEBRTC CONNECTION');
            console.log('[WebRTCPlayer] ========================================');
            console.log('[WebRTCPlayer] Sunshine Host:', sessionData.sunshineHost);
            console.log('[WebRTCPlayer] Sunshine Port:', sessionData.sunshinePort);
            console.log('[WebRTCPlayer] App Index:', sessionData.appIndex, '(Steam)');
            setConnectionState('connecting');

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: sessionData.webrtc.iceServers,
            });

            peerConnectionRef.current = pc;

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('[WebRTCPlayer] Connection state:', pc.connectionState);

                switch (pc.connectionState) {
                    case 'connected':
                        setConnectionState('connected');
                        setReconnectAttempts(0);
                        setError(null);
                        console.log('[WebRTCPlayer] ✅ WebRTC connected successfully!');
                        break;
                    case 'disconnected':
                        setConnectionState('disconnected');
                        handleReconnect();
                        break;
                    case 'failed':
                        setConnectionState('error');
                        setError({
                            type: 'stream_dropped',
                            message: 'Connection to stream failed',
                        });
                        handleReconnect();
                        break;
                    case 'closed':
                        setConnectionState('disconnected');
                        break;
                }
            };

            // Handle ICE connection state
            pc.oniceconnectionstatechange = () => {
                console.log('[WebRTCPlayer] ICE connection state:', pc.iceConnectionState);
            };

            // Handle incoming tracks
            pc.ontrack = (event) => {
                console.log('[WebRTCPlayer] Received track:', event.track.kind);

                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    console.log('[WebRTCPlayer] ✅ Video stream attached');
                }
            };

            // Create DataChannel for input forwarding
            const dataChannel = pc.createDataChannel('input', {
                ordered: false, // Low latency for input
                maxRetransmits: 0,
            });

            dataChannelRef.current = dataChannel;

            dataChannel.onopen = () => {
                console.log('[WebRTCPlayer] ✅ DataChannel opened');
            };

            dataChannel.onclose = () => {
                console.log('[WebRTCPlayer] DataChannel closed');
            };

            dataChannel.onerror = (error) => {
                console.error('[WebRTCPlayer] ❌ DataChannel error:', error);
            };

            // PHASE 11 FINAL: Create WebRTC offer and send to Sunshine
            console.log('[WebRTCPlayer] Creating WebRTC offer...');
            const offer = await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true,
            });

            await pc.setLocalDescription(offer);
            console.log('[WebRTCPlayer] ✅ Local description set');

            // PHASE 11 FINAL: Send offer to Sunshine with appIndex
            const protocol = 'https'; // Sunshine uses HTTPS
            const signalUrl = `${protocol}://${sessionData.sunshineHost}:${sessionData.sunshinePort}/api/webrtc`;

            console.log('[WebRTCPlayer] Sending offer to Sunshine:', signalUrl);
            console.log('[WebRTCPlayer] App Index:', sessionData.appIndex);

            const response = await fetch(signalUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'offer',
                    sdp: offer.sdp,
                    appIndex: sessionData.appIndex, // CRITICAL: Tells Sunshine to launch Steam (app #1)
                }),
            });

            if (!response.ok) {
                throw new Error(`Sunshine WebRTC signaling failed: ${response.status}`);
            }

            const answer = await response.json();
            console.log('[WebRTCPlayer] ✅ Received answer from Sunshine');

            // Set remote description
            await pc.setRemoteDescription(new RTCSessionDescription({
                type: 'answer',
                sdp: answer.sdp,
            }));

            console.log('[WebRTCPlayer] ✅ Remote description set');
            console.log('[WebRTCPlayer] ========================================');
            console.log('[WebRTCPlayer] WEBRTC INITIALIZED - STEAM LAUNCHING');
            console.log('[WebRTCPlayer] ========================================');

        } catch (err) {
            console.error('[WebRTCPlayer] ❌ Error initializing WebRTC:', err);
            setError({
                type: 'connection_failed',
                message: 'Failed to initialize connection',
                details: err instanceof Error ? err.message : undefined,
            });
            setConnectionState('error');
        }
    };

    /**
     * Handle reconnection attempts
     */
    const handleReconnect = () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('[WebRTCPlayer] Max reconnect attempts reached');
            setError({
                type: 'stream_dropped',
                message: 'Connection lost. Maximum retry attempts reached.',
            });
            return;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
        console.log(`[WebRTCPlayer] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            if (session) {
                initializeWebRTC(session);
            }
        }, delay);
    };

    /**
     * Retry connection
     */
    const handleRetry = () => {
        setError(null);
        setReconnectAttempts(0);
        setConnectionState('connecting');

        fetchSessionDetails().then(sessionData => {
            if (sessionData) {
                initializeWebRTC(sessionData);
            }
        });
    };

    /**
     * Toggle fullscreen
     */
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error('[WebRTCPlayer] Fullscreen error:', err);
        }
    };

    /**
     * Stop session and exit
     */
    const handleExit = async () => {
        try {
            console.log('[WebRTCPlayer] Stopping session:', sessionId);

            // Stop status polling
            stopStatusPolling();

            // Stop session
            await fetch('/api/play/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId,
                    reason: 'user_exit',
                }),
            });

            // Close peer connection
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            // Navigate back
            router.push('/games');
        } catch (err) {
            console.error('[WebRTCPlayer] Error stopping session:', err);
            // Navigate anyway
            router.push('/games');
        }
    };

    /**
     * Initialize on mount
     */
    useEffect(() => {
        const init = async () => {
            const sessionData = await fetchSessionDetails();
            if (sessionData) {
                await initializeWebRTC(sessionData);
                startStatusPolling();
            }
        };

        init();

        // Cleanup on unmount
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            stopStatusPolling();
        };
    }, [sessionId]);

    /**
     * Handle fullscreen change
     */
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    /**
     * Update duration from session
     */
    useEffect(() => {
        if (session?.duration !== undefined) {
            setDuration(session.duration);
        }
    }, [session?.duration]);

    /**
     * Render loading state
     */
    if (!session && !error) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading session...</p>
                </div>
            </div>
        );
    }

    /**
     * Render error state
     */
    if (error) {
        return (
            <ErrorOverlay
                type={error.type}
                message={error.message}
                details={error.details}
                onRetry={error.type !== 'session_expired' ? handleRetry : undefined}
                onExit={handleExit}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black">
            {/* Video Player */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                muted={false}
            />

            {/* Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                    {/* Connection Status */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {connectionState === 'connected' ? (
                                <>
                                    <Wifi className="w-5 h-5 text-green-400" />
                                    <span className="text-white text-sm font-medium">Connected</span>
                                </>
                            ) : connectionState === 'connecting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                                    <span className="text-white text-sm font-medium">Connecting...</span>
                                </>
                            ) : connectionState === 'disconnected' ? (
                                <>
                                    <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                    <span className="text-white text-sm font-medium">
                                        Reconnecting ({reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS})
                                    </span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-5 h-5 text-red-400" />
                                    <span className="text-white text-sm font-medium">Disconnected</span>
                                </>
                            )}
                        </div>

                        {/* Gamepad Indicator */}
                        <GamepadIndicator gamepads={gamepads} />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={toggleFullscreen}
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowEndConfirm(true)}
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-red-500/20"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Display */}
            {connectionState === 'connected' && (
                <StatsDisplay
                    latency={latency}
                    duration={duration}
                    className="absolute bottom-4 right-4"
                />
            )}

            {/* End Session Confirmation */}
            {showEndConfirm && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/20 rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-white text-lg font-bold mb-3">End Session?</h3>
                        <p className="text-gray-300 text-sm mb-6">
                            Are you sure you want to end your gaming session?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleExit}
                                className="flex-1 bg-red-600 text-white hover:bg-red-500"
                            >
                                End Session
                            </Button>
                            <Button
                                onClick={() => setShowEndConfirm(false)}
                                variant="outline"
                                className="flex-1 border-white/20 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Info (Debug) */}
            {process.env.NODE_ENV === 'development' && session && (
                <div className="absolute bottom-4 left-4 bg-black/80 border border-white/20 rounded-lg p-3 text-xs text-white/60 font-mono">
                    <div>Session: {sessionId.substring(0, 8)}...</div>
                    <div>Host: {session.sunshineHost}</div>
                    <div>Port: {session.sunshineStreamPort}</div>
                    <div>State: {connectionState}</div>
                    <div>Reconnects: {reconnectAttempts}</div>
                </div>
            )}
        </div>
    );
}

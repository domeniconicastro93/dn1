'use client';

import { useEffect, useRef, useState } from 'react';

export interface WebRTCStreamPlayerProps {
    sessionId: string;
    orchestratorUrl: string;
    width?: number;
    height?: number;
    fps?: number;
    bitrate?: number;
}

export function WebRTCStreamPlayer({
    sessionId,
    orchestratorUrl,
    width = 1920,
    height = 1080,
    fps = 60,
    bitrate = 10000,
}: WebRTCStreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
    const [error, setError] = useState<string | null>(null);
    const [iceCandidateCount, setIceCandidateCount] = useState(0);
    const [videoFrameDetected, setVideoFrameDetected] = useState(false);

    useEffect(() => {
        let pc: RTCPeerConnection | null = null;

        async function startStream() {
            try {
                console.log('[WebRTCStreamPlayer] === STARTING STREAM ===');
                console.log('[WebRTCStreamPlayer] Session ID:', sessionId);

                // Create RTCPeerConnection
                pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                    ],
                });

                pcRef.current = pc;

                // ICE retry state
                let iceRetryCount = 0;
                const MAX_ICE_RETRIES = 8;
                let iceRetryInterval: NodeJS.Timeout | null = null;

                // Track connection state
                pc.onconnectionstatechange = () => {
                    const state = pc?.connectionState || 'new';
                    console.log('[WebRTCStreamPlayer] 🔄 Connection state:', state);
                    console.log('[Peer connectionState]=', state);
                    setConnectionState(state);

                    if (state === 'connected') {
                        console.log('[WebRTCStreamPlayer] ✅ PEER CONNECTION ESTABLISHED');
                        // Stop ICE retry loop
                        if (iceRetryInterval) {
                            clearInterval(iceRetryInterval);
                            iceRetryInterval = null;
                        }
                    } else if (state === 'failed') {
                        console.error('[WebRTCStreamPlayer] ❌ PEER CONNECTION FAILED');
                        if (iceRetryInterval) {
                            clearInterval(iceRetryInterval);
                            iceRetryInterval = null;
                        }
                    }
                };

                // Track ICE connection state
                pc.oniceconnectionstatechange = () => {
                    const iceState = pc?.iceConnectionState;
                    console.log('[WebRTCStreamPlayer] 🧊 ICE connection state:', iceState);
                    console.log('[ICE connectionState]=', iceState);
                };

                // Handle ICE candidates
                let candidateCount = 0;
                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        candidateCount++;
                        console.log(`[WebRTCStreamPlayer] 🧊 ICE candidate #${candidateCount}:`, event.candidate.candidate.substring(0, 50) + '...');
                        setIceCandidateCount(candidateCount);

                        try {
                            const webrtcServiceUrl = process.env.NEXT_PUBLIC_WEBRTC_SERVICE_URL || 'http://108.142.237.74:3015';
                            await fetch(`${webrtcServiceUrl}/webrtc/session/${sessionId}/ice`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ candidate: event.candidate }),
                            });
                            console.log(`[WebRTCStreamPlayer] ✅ ICE candidate #${candidateCount} sent`);
                        } catch (err) {
                            console.error('[WebRTCStreamPlayer] ❌ Failed to send ICE candidate:', err);
                        }
                    } else {
                        console.log('[WebRTCStreamPlayer] 🧊 ICE gathering complete. Total candidates:', candidateCount);
                    }
                };

                // Handle incoming track (video stream)
                pc.ontrack = (event) => {
                    console.log('[WebRTCStreamPlayer] ✅ Track received');
                    console.log('[WebRTCStreamPlayer] 📺 Track kind:', event.track.kind);
                    console.log('[WebRTCStreamPlayer] 📺 Track id:', event.track.id);
                    console.log('[WebRTCStreamPlayer] 📺 Streams count:', event.streams.length);

                    if (videoRef.current && event.streams[0]) {
                        videoRef.current.srcObject = event.streams[0];
                        setVideoFrameDetected(true);
                        console.log('[WebRTCStreamPlayer] ✅ Video stream attached to <video> element');
                        console.log('[VIDEO TRACK]= received');

                        // Monitor for actual video frames
                        const stream = event.streams[0];
                        const tracks = stream.getVideoTracks();
                        if (tracks.length > 0) {
                            console.log('[WebRTCStreamPlayer] 📺 Video track enabled:', tracks[0].enabled);
                            console.log('[WebRTCStreamPlayer] 📺 Video track ready state:', tracks[0].readyState);

                            // Listen for first frame
                            videoRef.current.onloadeddata = () => {
                                console.log('[WebRTCStreamPlayer] 🎬 VIDEO FRAMES FLOWING - First frame rendered!');
                                console.log('[VIDEO TRACK]= active and rendering');
                            };

                            // Timeout check for black screen (2 seconds)
                            setTimeout(() => {
                                if (videoRef.current && videoRef.current.videoWidth === 0) {
                                    console.warn('[WebRTCStreamPlayer] ⚠️ Video track received but no frames after 2s - possible black screen');
                                }
                            }, 2000);
                        }
                    }
                };

                // STEP 1: Get SDP Offer from orchestrator/webrtc-service
                console.log('[WebRTCStreamPlayer] Fetching SDP offer...');

                const webrtcServiceUrl = process.env.NEXT_PUBLIC_WEBRTC_SERVICE_URL || 'http://108.142.237.74:3015';
                const startResponse = await fetch(`${webrtcServiceUrl}/webrtc/session/${sessionId}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ width, height, fps, bitrate }),
                });

                if (!startResponse.ok) {
                    throw new Error(`Failed to start session: ${startResponse.status} ${await startResponse.text()}`);
                }

                const { offer } = await startResponse.json();
                console.log('[WebRTCStreamPlayer] ✅ SDP Offer received');

                // STEP 2: Set remote description (offer)
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                console.log('[WebRTCStreamPlayer] ✅ Remote description set');

                // STEP 3: Create answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log('[WebRTCStreamPlayer] ✅ Local description (answer) created');

                // STEP 4: Send answer back to webrtc-service
                const answerResponse = await fetch(`${webrtcServiceUrl}/webrtc/session/${sessionId}/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answer }),
                });

                if (!answerResponse.ok) {
                    throw new Error(`Failed to send answer: ${answerResponse.status}`);
                }

                console.log('[WebRTCStreamPlayer] ✅ Answer sent');
                console.log('[WebRTCStreamPlayer] === STREAM SETUP COMPLETE ===');

                // STEP 5: ICE Connection Retry Loop
                console.log('[WebRTCStreamPlayer] Starting ICE retry loop...');

                iceRetryInterval = setInterval(() => {
                    iceRetryCount++;
                    const candidateCount = iceCandidateCount;
                    const peerState = pc?.connectionState || 'unknown';
                    const iceState = pc?.iceConnectionState || 'unknown';

                    console.log(`[ICE attempt #${iceRetryCount}]`);
                    console.log(`[ICE candidates count]= ${candidateCount}`);
                    console.log(`[Peer connectionState]= ${peerState}`);
                    console.log(`[ICE connectionState]= ${iceState}`);

                    if (peerState === 'connected' && iceState === 'connected') {
                        console.log('[WebRTCStreamPlayer] ✅ ICE CONNECTED - stopping retry loop');
                        if (iceRetryInterval) {
                            clearInterval(iceRetryInterval);
                            iceRetryInterval = null;
                        }
                    } else if (iceRetryCount >= MAX_ICE_RETRIES) {
                        console.error('[WebRTCStreamPlayer] ❌ ICE retry limit reached. Connection failed.');
                        if (iceRetryInterval) {
                            clearInterval(iceRetryInterval);
                            iceRetryInterval = null;
                        }
                        setError('ICE connection timeout - max retries reached');
                    }
                }, 1000);  // Check every 1 second

            } catch (err: any) {
                console.error('[WebRTCStreamPlayer] === ERROR ===', err);
                setError(err.message || 'Failed to start stream');
            }
        }

        startStream();

        // Cleanup
        return () => {
            console.log('[WebRTCStreamPlayer] Cleaning up connection');
            if (pc) {
                pc.close();
            }
        };
    }, [sessionId, width, height, fps, bitrate]);

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4">Stream Error</p>
                    <p className="text-white/60 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.href = '/games'}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                    >
                        Back to Games
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black relative">
            {/* Video element */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-contain"
                style={{ maxHeight: '100vh' }}
            />

            {/* Connection Status Overlay */}
            <div className="fixed top-4 right-4 z-50">
                <div className="rounded-lg border border-white/20 bg-black/80 px-4 py-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${connectionState === 'connected'
                                ? 'bg-green-400'
                                : connectionState === 'connecting'
                                    ? 'bg-yellow-400 animate-pulse'
                                    : 'bg-red-400'
                                }`}
                        />
                        <span className="text-xs text-white/80 uppercase tracking-wider">
                            {connectionState === 'connected'
                                ? 'Live'
                                : connectionState === 'connecting'
                                    ? 'Connecting...'
                                    : connectionState}
                        </span>
                    </div>
                </div>
            </div>

            {/* Session Info (bottom right) */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="rounded-lg border border-white/20 bg-black/80 px-4 py-2 backdrop-blur-sm">
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Session</p>
                    <p className="text-sm text-white/80 font-mono">{sessionId.split('-')[0]}...</p>
                </div>
            </div>
        </div>
    );
}

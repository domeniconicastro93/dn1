'use client';

/**
 * Strike WebRTC Stream Player
 * 
 * This component implements a REAL WebRTC client that:
 * 1. Uses RTCPeerConnection for media transport (RTP/SRTP)
 * 2. Uses HTTP/fetch for signaling (SDP offer/answer, ICE candidates)
 * 3. Does NOT stream video over WebSocket
 * 
 * Architecture:
 * - Browser RTCPeerConnection ↔ Server RTCPeerConnection
 * - HTTP for signaling (offer/answer/ICE)
 * - RTP/SRTP for media (video/audio)
 */

import { useEffect, useRef, useState } from 'react';

interface WebRTCStreamPlayerProps {
    sessionId: string;
    orchestratorUrl?: string;  // Changed from serverUrl - must point to orchestrator, NOT webrtc service
    width?: number;
    height?: number;
    fps?: number;
    bitrate?: number;
}

export function WebRTCStreamPlayer({
    sessionId,
    orchestratorUrl = '/api/orchestrator/v1',  // Relative URL to orchestrator
    width = 1920,
    height = 1080,
    fps = 60,
    bitrate = 10000
}: WebRTCStreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
    const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
    const [error, setError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        console.log('[WebRTC] Initializing Strike WebRTC client...');
        console.log('[WebRTC] Session:', sessionId);
        console.log('[WebRTC] Orchestrator:', orchestratorUrl);

        // ❌ SAFETY GUARD: Prevent direct calls to webrtc service
        if (orchestratorUrl.includes(':3015')) {
            throw new Error('Browser must not call internal webrtc service (:3015). Use orchestrator endpoints only.');
        }

        let pc: RTCPeerConnection | null = null;

        async function initializeWebRTC() {
            try {
                // Create RTCPeerConnection with gaming-optimized config
                pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ],
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require'
                });

                peerConnectionRef.current = pc;

                // Handle incoming media tracks
                pc.ontrack = (event) => {
                    console.log('[WebRTC] Received track:', event.track.kind);

                    if (videoRef.current && event.streams[0]) {
                        videoRef.current.srcObject = event.streams[0];
                        setIsStreaming(true);
                        console.log('[WebRTC] ✅ Video stream attached');
                    }
                };

                // Handle ICE candidates
                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        console.log('[WebRTC] Sending ICE candidate to orchestrator');

                        try {
                            await fetch(`${orchestratorUrl}/webrtc/session/ice`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sessionId, candidate: event.candidate })
                            });
                        } catch (err: any) {
                            console.error('[WebRTC] Failed to send ICE candidate:', err);
                        }
                    }
                };

                // Handle connection state changes
                pc.onconnectionstatechange = () => {
                    console.log('[WebRTC] Connection state:', pc!.connectionState);
                    setConnectionState(pc!.connectionState);

                    if (pc!.connectionState === 'failed') {
                        setError('WebRTC connection failed');
                    }
                };

                // Handle ICE connection state
                pc.oniceconnectionstatechange = () => {
                    console.log('[WebRTC] ICE connection state:', pc!.iceConnectionState);
                    setIceConnectionState(pc!.iceConnectionState);
                };

                // STEP 1: Request orchestrator to create session and get offer
                console.log('[WebRTC] Requesting session from orchestrator...');
                const startResponse = await fetch(`${orchestratorUrl}/session/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: 'user-1',  // TODO: Get from auth context
                        appId: 'game-1',    // TODO: Get from props
                        sessionId
                    })
                });

                if (!startResponse.ok) {
                    throw new Error(`Failed to start session: ${startResponse.statusText}`);
                }

                const { offer } = await startResponse.json();
                console.log('[WebRTC] Received offer from orchestrator');

                // STEP 2: Set remote description (server's offer)
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                console.log('[WebRTC] Set remote description');

                // STEP 3: Create answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log('[WebRTC] Created answer');

                // STEP 4: Send answer to orchestrator
                const answerResponse = await fetch(`${orchestratorUrl}/webrtc/session/answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, answer })
                });

                if (!answerResponse.ok) {
                    throw new Error(`Failed to send answer: ${answerResponse.statusText}`);
                }

                console.log('[WebRTC] Answer sent to orchestrator');
                console.log('[WebRTC] ✅ WebRTC negotiation complete, waiting for media...');

            } catch (err: any) {
                console.error('[WebRTC] Error:', err);
                setError(err.message);
            }
        }

        initializeWebRTC();

        // Cleanup
        return () => {
            console.log('[WebRTC] Cleaning up...');

            if (pc) {
                pc.close();
            }

            // Stop session via orchestrator
            fetch(`${orchestratorUrl}/webrtc/session/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            }).catch(err => console.error('[WebRTC] Failed to stop session:', err));
        };
    }, [sessionId, orchestratorUrl, width, height, fps, bitrate]);

    return (
        <div className="webrtc-stream-player">
            <div className="stream-container">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="stream-video"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000'
                    }}
                />

                {/* Connection Status Overlay */}
                {!isStreaming && (
                    <div className="stream-overlay">
                        <div className="stream-status">
                            {error ? (
                                <>
                                    <div className="status-icon error">❌</div>
                                    <div className="status-text">Connection Error</div>
                                    <div className="status-detail">{error}</div>
                                </>
                            ) : connectionState === 'connecting' || connectionState === 'new' ? (
                                <>
                                    <div className="status-icon connecting">🔄</div>
                                    <div className="status-text">Connecting...</div>
                                    <div className="status-detail">Establishing WebRTC connection</div>
                                </>
                            ) : connectionState === 'connected' ? (
                                <>
                                    <div className="status-icon">⏳</div>
                                    <div className="status-text">Waiting for stream...</div>
                                    <div className="status-detail">Media negotiation in progress</div>
                                </>
                            ) : (
                                <>
                                    <div className="status-icon">⚠️</div>
                                    <div className="status-text">Disconnected</div>
                                    <div className="status-detail">Connection lost</div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Debug Info */}
            <div className="stream-debug">
                <div className="debug-item">
                    <span className="debug-label">Session:</span>
                    <span className="debug-value">{sessionId}</span>
                </div>
                <div className="debug-item">
                    <span className="debug-label">Connection:</span>
                    <span className={`debug-value state-${connectionState}`}>
                        {connectionState}
                    </span>
                </div>
                <div className="debug-item">
                    <span className="debug-label">ICE:</span>
                    <span className={`debug-value state-${iceConnectionState}`}>
                        {iceConnectionState}
                    </span>
                </div>
                <div className="debug-item">
                    <span className="debug-label">Streaming:</span>
                    <span className="debug-value">{isStreaming ? '✅ Yes' : '⏳ No'}</span>
                </div>
                <div className="debug-item">
                    <span className="debug-label">Transport:</span>
                    <span className="debug-value">WebRTC (RTP/SRTP)</span>
                </div>
            </div>

            <style jsx>{`
        .webrtc-stream-player {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #000;
        }

        .stream-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .stream-video {
          width: 100%;
          height: 100%;
        }

        .stream-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
        }

        .stream-status {
          text-align: center;
          color: white;
        }

        .status-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .status-icon.connecting {
          animation: spin 2s linear infinite;
        }

        .status-icon.error {
          animation: shake 0.5s;
        }

        .status-text {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .status-detail {
          font-size: 1rem;
          opacity: 0.7;
        }

        .stream-debug {
          padding: 1rem;
          background: rgba(0, 0, 0, 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .debug-item {
          display: flex;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .debug-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .debug-value {
          color: white;
          font-weight: 500;
        }

        .debug-value.state-connected {
          color: #10b981;
        }

        .debug-value.state-connecting,
        .debug-value.state-new {
          color: #f59e0b;
        }

        .debug-value.state-failed,
        .debug-value.state-disconnected,
        .debug-value.state-closed {
          color: #ef4444;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
        </div>
    );
}

'use client';

/**
 * ❌ DEPRECATED: WebSocket-based streaming
 * 
 * This component streams video over WebSocket, which is WRONG for Strike.
 * 
 * DO NOT USE THIS COMPONENT. Browser must not call :3015 directly.
 * 
 * Use WebRTCStreamPlayer instead, which uses:
 * - RTCPeerConnection for media (RTP/SRTP)
 * - HTTP/fetch for signaling via orchestrator
 * 
 * This file is kept temporarily for reference only.
 * Date deprecated: 2025-12-11
 */

import { useEffect, useRef, useState } from 'react';

interface WebSocketStreamPlayerProps {
    sessionId: string;
    serverUrl?: string;
}

export function WebSocketStreamPlayer({
    sessionId,
    serverUrl = 'DEPRECATED_DO_NOT_USE'  // Changed from ws://localhost:3015
}: WebSocketStreamPlayerProps) {
    // ❌ THROW ERROR: Prevent usage
    throw new Error('WebSocketStreamPlayer is DEPRECATED. Use WebRTCStreamPlayer instead. Browser must not call :3015 directly.');

    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);

    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [error, setError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        console.log('[WebSocketStream] Initializing...');

        // Create MediaSource
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(mediaSource);
        }

        // Wait for MediaSource to open
        mediaSource.addEventListener('sourceopen', () => {
            console.log('[MediaSource] Opened');

            try {
                // Create SourceBuffer for MPEG-TS
                const sourceBuffer = mediaSource.addSourceBuffer('video/mp2t; codecs="avc1.42E01E"');
                sourceBufferRef.current = sourceBuffer;

                sourceBuffer.addEventListener('updateend', () => {
                    // Buffer updated
                });

                sourceBuffer.addEventListener('error', (e) => {
                    console.error('[SourceBuffer] Error:', e);
                    setError('SourceBuffer error');
                });

                console.log('[SourceBuffer] Created');
            } catch (err: any) {
                console.error('[MediaSource] Error creating SourceBuffer:', err);
                setError(err.message);
            }
        });

        // Connect WebSocket
        const wsUrl = `${serverUrl}/stream/${sessionId}`;
        console.log('[WebSocket] Connecting to:', wsUrl);

        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WebSocket] Connected');
            setConnectionState('connected');
        };

        ws.onmessage = (event) => {
            if (!sourceBufferRef.current || !mediaSourceRef.current) {
                return;
            }

            try {
                const data = new Uint8Array(event.data);

                // Append data to SourceBuffer
                if (!sourceBufferRef.current.updating && mediaSourceRef.current.readyState === 'open') {
                    sourceBufferRef.current.appendBuffer(data);

                    if (!isStreaming) {
                        setIsStreaming(true);
                        console.log('[Stream] Started');
                    }
                }
            } catch (err: any) {
                console.error('[WebSocket] Error processing data:', err);
            }
        };

        ws.onerror = (event) => {
            console.error('[WebSocket] Error:', event);
            setConnectionState('error');
            setError('WebSocket connection error');
        };

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected');
            setConnectionState('disconnected');
        };

        // Cleanup
        return () => {
            console.log('[WebSocketStream] Cleaning up...');

            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }

            if (mediaSource.readyState === 'open') {
                mediaSource.endOfStream();
            }
        };
    }, [sessionId, serverUrl]);

    return (
        <div className="websocket-stream-player">
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
                            ) : connectionState === 'connecting' ? (
                                <>
                                    <div className="status-icon connecting">🔄</div>
                                    <div className="status-text">Connecting...</div>
                                    <div className="status-detail">Establishing WebSocket connection</div>
                                </>
                            ) : connectionState === 'connected' ? (
                                <>
                                    <div className="status-icon">⏳</div>
                                    <div className="status-text">Waiting for stream...</div>
                                    <div className="status-detail">FFmpeg is starting</div>
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
                    <span className="debug-label">State:</span>
                    <span className={`debug-value state-${connectionState}`}>
                        {connectionState}
                    </span>
                </div>
                <div className="debug-item">
                    <span className="debug-label">Streaming:</span>
                    <span className="debug-value">{isStreaming ? '✅ Yes' : '⏳ No'}</span>
                </div>
            </div>

            <style jsx>{`
        .websocket-stream-player {
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

        .debug-value.state-connecting {
          color: #f59e0b;
        }

        .debug-value.state-error,
        .debug-value.state-disconnected {
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

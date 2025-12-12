'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, MessageSquare, Users } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ApolloWebRTCPlayerProps {
    host: string;
    port: number;
    sessionId: string;
    gameId: string;
}

export default function ApolloWebRTCPlayer({
    host,
    port,
    sessionId,
    gameId,
}: ApolloWebRTCPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [showFriends, setShowFriends] = useState(true);
    const [showWebcam, setShowWebcam] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>('Connecting to signaling server...');

    useEffect(() => {
        console.log('[WebRTC] Initializing connection...');
        setConnectionStatus('Connecting to signaling server...');

        // Connect to signaling server
        const socketConnection = io('http://localhost:3012', {
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        });

        socketConnection.on('connect', () => {
            console.log('[WebRTC] Connected to signaling server');
            setConnectionStatus('Connected to signaling server');

            // Join session room
            socketConnection.emit('join-session', sessionId);
            console.log('[WebRTC] Joined session:', sessionId);

            // Create RTCPeerConnection
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            // Handle incoming stream
            peerConnection.ontrack = (event) => {
                console.log('[WebRTC] Received remote track:', event.track.kind);
                if (videoRef.current && event.streams[0]) {
                    videoRef.current.srcObject = event.streams[0];
                    setConnectionStatus('Streaming');
                    console.log('[WebRTC] Video stream attached to element');
                }
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[WebRTC] Sending ICE candidate');
                    socketConnection.emit('ice-candidate', {
                        type: 'ice-candidate',
                        sessionId,
                        data: event.candidate
                    });
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log('[WebRTC] Connection state:', peerConnection.connectionState);
                setConnectionStatus(`Connection: ${peerConnection.connectionState}`);
            };

            peerConnection.oniceconnectionstatechange = () => {
                console.log('[WebRTC] ICE connection state:', peerConnection.iceConnectionState);
            };

            // Create offer
            setConnectionStatus('Creating WebRTC offer...');
            peerConnection.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            }).then((offer) => {
                console.log('[WebRTC] Created offer');
                return peerConnection.setLocalDescription(offer);
            }).then(() => {
                console.log('[WebRTC] Set local description');
                setConnectionStatus('Sending offer to Apollo...');

                // Send offer to signaling server
                socketConnection.emit('offer', {
                    type: 'offer',
                    sessionId,
                    data: peerConnection.localDescription
                });
            }).catch((error) => {
                console.error('[WebRTC] Error creating offer:', error);
                setConnectionStatus(`Error: ${error.message}`);
            });

            setPc(peerConnection);
        });

        // Handle answer from signaling server
        socketConnection.on('answer', (message: any) => {
            console.log('[WebRTC] Received answer from Apollo');
            setConnectionStatus('Received answer, establishing connection...');

            if (pc) {
                pc.setRemoteDescription(new RTCSessionDescription(message.data))
                    .then(() => {
                        console.log('[WebRTC] Set remote description');
                        setConnectionStatus('Connecting to Apollo...');
                    })
                    .catch((error) => {
                        console.error('[WebRTC] Error setting remote description:', error);
                        setConnectionStatus(`Error: ${error.message}`);
                    });
            }
        });

        // Handle errors
        socketConnection.on('error', (error: any) => {
            console.error('[WebRTC] Signaling error:', error);
            setConnectionStatus(`Error: ${error.message}`);
        });

        socketConnection.on('disconnect', () => {
            console.log('[WebRTC] Disconnected from signaling server');
            setConnectionStatus('Disconnected');
        });

        setSocket(socketConnection);

        return () => {
            console.log('[WebRTC] Cleaning up...');
            if (pc) {
                pc.close();
            }
            socketConnection.disconnect();
        };
    }, [sessionId]);

    // Initialize webcam
    useEffect(() => {
        if (showWebcam) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then((stream) => {
                    setWebcamStream(stream);
                    if (webcamVideoRef.current) {
                        webcamVideoRef.current.srcObject = stream;
                    }
                })
                .catch((err) => {
                    console.error('Failed to get webcam:', err);
                });
        } else {
            if (webcamStream) {
                webcamStream.getTracks().forEach((track) => track.stop());
                setWebcamStream(null);
            }
        }

        return () => {
            if (webcamStream) {
                webcamStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [showWebcam, webcamStream]);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-[#0a0520] overflow-hidden">
            {/* Friends Sidebar (Left) */}
            {showFriends && (
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f0a2e]/95 backdrop-blur-md border-r border-white/10 z-20 overflow-y-auto">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                FRIENDS
                            </h2>
                            <button
                                onClick={() => setShowFriends(false)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {['Alexa', 'Alexon', 'Alexie', 'Alexay'].map((name) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                                    <div>
                                        <p className="text-white text-sm font-medium">{name}</p>
                                        <p className="text-white/40 text-xs">Playing Apex</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">
                                CHANNEL
                            </h3>
                            <div className="space-y-1">
                                {['#GenreI', '#GenreII', '#GenreIII', '#GenreIV'].map((channel, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <span className="text-white/80 text-sm">{channel}</span>
                                        <span className="text-white/40 text-xs">02</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Game Stream Area */}
            <div
                className={`absolute top-0 bottom-0 ${showFriends ? 'left-64' : 'left-0'
                    } ${showChat ? 'right-80' : 'right-0'} transition-all duration-300`}
            >
                <div className="relative w-full h-full">
                    {/* WebRTC Video Stream */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain bg-black"
                    />

                    {/* Connection Status Overlay */}
                    {connectionStatus !== 'Streaming' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-white text-lg">{connectionStatus}</p>
                                <p className="text-white/60 text-sm mt-2">Apollo WebRTC Streaming</p>
                            </div>
                        </div>
                    )}

                    {/* Game Info Overlay (Top) */}
                    <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-white text-2xl font-bold">{gameId}</h1>
                                <p className="text-white/60 text-sm">Apollo WebRTC Streaming</p>
                            </div>
                        </div>
                    </div>

                    {/* Controls (Bottom Center) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto z-30">
                        <button className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
                            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            Go Live
                        </button>
                        <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors">
                            Reels
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors backdrop-blur-sm"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-5 h-5" />
                            ) : (
                                <Maximize2 className="w-5 h-5" />
                            )}
                            Full Screen
                        </button>
                        {!showWebcam && (
                            <button
                                onClick={() => setShowWebcam(true)}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors backdrop-blur-sm"
                            >
                                Enable Webcam
                            </button>
                        )}
                    </div>

                    {/* Webcam Overlay (Bottom Right) */}
                    {showWebcam && (
                        <div className="absolute bottom-20 right-6 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl pointer-events-auto z-30">
                            <video
                                ref={webcamVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                            <button
                                onClick={() => setShowWebcam(false)}
                                className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-600 rounded-full flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                <span className="text-white text-xs font-semibold">Live</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Sidebar (Right) */}
            {showChat && (
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0f0a2e]/95 backdrop-blur-md border-l border-white/10 z-20 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Live Chat
                            </h2>
                            <button
                                onClick={() => setShowChat(false)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-white/40 text-xs">5 People</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {[
                            { user: 'Player_42', msg: 'GG!' },
                            { user: 'Game Master', msg: 'Nice Shot!' },
                            { user: 'Vitu_08', msg: 'Nice Shot!' },
                        ].map((chat, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="text-white/80 text-sm font-medium">{chat.user}</p>
                                    <p className="text-white/60 text-sm">{chat.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Send Message"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button className="w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center transition-colors">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Buttons */}
            {!showFriends && (
                <button
                    onClick={() => setShowFriends(true)}
                    className="fixed left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-30"
                >
                    <Users className="w-6 h-6 text-white" />
                </button>
            )}
            {!showChat && (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors z-30"
                >
                    <MessageSquare className="w-6 h-6 text-white" />
                </button>
            )}

            {/* Session Info */}
            <div className="fixed bottom-6 left-6 z-50 rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm px-4 py-2 text-white/80 pointer-events-none">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Apollo WebRTC
                </p>
                <p className="text-sm font-semibold break-all">{sessionId}</p>
                <p className="text-xs text-emerald-200">
                    {host}:{port}
                </p>
            </div>

            <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Pause, Play, Volume2, VolumeX, Settings, Maximize2 } from 'lucide-react';
import type { GameSession } from '@/types/phase2';

interface CloudGamingPlayerProps {
  session: GameSession;
}

export function CloudGamingPlayer({ session }: CloudGamingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  // TODO: Replace with actual WebRTC implementation in Phase 5
  // This is a placeholder that shows a mock video player

  return (
    <div
      className="relative w-full h-screen bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Player Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Connecting to game server...</p>
          <p className="text-gray-400 text-sm">Session ID: {session.id}</p>
          <p className="text-gray-400 text-sm mt-1">Stream URL: {session.streamUrl}</p>
          {session.host && (
            <div className="mt-4 p-4 bg-white/10 rounded text-left">
              <p className="text-green-400 font-bold mb-2">Sunshine Connection Info:</p>
              <p className="text-gray-300 text-sm">Host: {session.host}</p>
              <p className="text-gray-300 text-sm">Port: {session.port}</p>
              <p className="text-gray-300 text-sm">UDP Ports: {session.udpPorts?.join(', ')}</p>
              <p className="text-gray-300 text-sm">Protocol: {session.protocol}</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Quality Indicator */}
      <div className="absolute top-4 left-4 z-20">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${connectionQuality === 'excellent' ? 'bg-green-500/80 text-white' :
            connectionQuality === 'good' ? 'bg-blue-500/80 text-white' :
              connectionQuality === 'fair' ? 'bg-yellow-500/80 text-white' :
                'bg-red-500/80 text-white'
          }`}>
          {connectionQuality.toUpperCase()}
        </div>
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 z-10">
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
              <Maximize2 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 text-white ml-1" fill="white" />
              ) : (
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-4">
              <button
                className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-1/3" />
              </div>
              <span className="text-white text-sm">00:00 / 00:00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Heart, MessageCircle, Share2, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Hls from 'hls.js';
import { LiveStreamChat } from './LiveStreamChat';
import { LiveStreamInteractions } from './LiveStreamInteractions';

interface LiveViewerPageProps {
  streamId?: string;
}

export function LiveViewerPage({ streamId: propStreamId }: LiveViewerPageProps) {
  const params = useParams();
  const streamId = propStreamId || (params.id as string) || (params.streamId as string);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const interactionsWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!streamId) return;

    const loadStream = async () => {
      try {
        setLoading(true);

        // Get stream status
        const statusResponse = await fetch(`/api/streaming/v1/live/${streamId}/status`);
        if (!statusResponse.ok) {
          throw new Error('Failed to load stream status');
        }

        const statusData = await statusResponse.json();
        if (!statusData.data?.isLive) {
          setError('Stream is not live');
          setLoading(false);
          return;
        }

        setIsLive(true);
        setViewerCount(statusData.data.viewerCount || 0);
        setLikes(statusData.data.interactions?.likes || 0);

        // Load HLS stream
        const hlsUrl = statusData.data.hlsUrl;
        if (hlsUrl && videoRef.current) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });

            hls.loadSource(hlsUrl);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              videoRef.current?.play();
              setLoading(false);
            });

            hlsRef.current = hls;
          } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS support
            videoRef.current.src = hlsUrl;
            videoRef.current.addEventListener('loadedmetadata', () => {
              videoRef.current?.play();
              setLoading(false);
            });
          } else {
            throw new Error('HLS not supported');
          }
        }

        // Connect to interactions WebSocket
        const interactionsUrl = `ws://${process.env.NEXT_PUBLIC_STREAMING_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_WS_PORT || '3014'}?streamId=${streamId}&type=interactions`;
        const ws = new WebSocket(interactionsUrl);

        ws.onopen = () => {
          console.log('Connected to interactions WebSocket');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'interaction') {
            if (data.interactionType === 'like') {
              setLikes((prev) => prev + 1);
            } else if (data.interactionType === 'viewer-count') {
              setViewerCount(data.count);
            }
          } else if (data.type === 'interaction-stats') {
            setLikes(data.likes || 0);
            setViewerCount(data.viewers || 0);
          }
        };

        interactionsWsRef.current = ws;

        // Update stats periodically
        const statsInterval = setInterval(async () => {
          try {
            const response = await fetch(`/api/streaming/v1/live/${streamId}/status`);
            if (response.ok) {
              const data = await response.json();
              if (data.data) {
                setViewerCount(data.data.viewerCount || 0);
                setLikes(data.data.interactions?.likes || 0);
              }
            }
          } catch (err) {
            console.error('Failed to update stats:', err);
          }
        }, 5000);

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          if (interactionsWsRef.current) {
            interactionsWsRef.current.close();
          }
          clearInterval(statsInterval);
        };
      } catch (err) {
        console.error('Failed to load stream:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stream');
        setLoading(false);
      }
    };

    loadStream();
  }, [streamId]);

  const handleLike = async () => {
    try {
      await fetch(`/api/streaming/v1/live/${streamId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token
        },
      });
    } catch (err) {
      console.error('Failed to like stream:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex h-screen">
        {/* Video Player */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />

          {/* Live Badge */}
          {isLive && (
            <div className="absolute top-4 left-4 bg-red-500 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white font-semibold text-sm">LIVE</span>
            </div>
          )}

          {/* Stats Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">
                {viewerCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
              <Heart className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">
                {likes.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-3">
            <Button
              onClick={handleLike}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
            >
              <Heart className="w-6 h-6 text-white" />
            </Button>
            <Button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
              <Share2 className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-[#080427] border-l border-white/10 flex flex-col">
          {/* Interactions */}
          <div className="p-4 border-b border-white/10">
            <LiveStreamInteractions streamId={streamId} />
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <LiveStreamChat streamId={streamId} />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveReplay, getReplayStatus } from '@/lib/api-client';
import { useStrikeSession } from '@/hooks/useStrikeSession';
import type { ReplayRequest } from '@/types/phase2';

interface SaveReplayButtonProps {
  sessionId: string;
  gameId: string;
}

export function SaveReplayButton({ sessionId, gameId }: SaveReplayButtonProps) {
  const { authenticated, user } = useStrikeSession();
  const [status, setStatus] = useState<'idle' | 'saving' | 'processing' | 'success' | 'error'>('idle');
  const [replayId, setReplayId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveReplay = async () => {
    if (!authenticated || !user) {
      setError('You must be logged in to save replays');
      setStatus('error');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const request: ReplayRequest = {
        sessionId,
        userId: user.id,
        gameId,
        qualityPreset: 'high',
      };

      const response = await saveReplay(request);
      setReplayId(response.replayId);

      if (response.status === 'ready') {
        setStatus('success');
      } else {
        setStatus('processing');
        // Poll for status
        pollReplayStatus(response.replayId);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save replay');
    }
  };

  const pollReplayStatus = async (id: string) => {
    const maxAttempts = 10;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const status = await getReplayStatus(id);
        if (status.status === 'ready') {
          setStatus('success');
          clearInterval(interval);
        } else if (status.status === 'failed' || attempts >= maxAttempts) {
          setStatus('error');
          setError('Replay processing failed');
          clearInterval(interval);
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          setStatus('error');
          setError('Failed to check replay status');
          clearInterval(interval);
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-white">
        <Check className="w-5 h-5" />
        <span className="text-sm">Replay saved!</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-white">
          <span className="text-sm">{error || 'Error saving replay'}</span>
        </div>
        <Button
          onClick={handleSaveReplay}
          size="sm"
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm">
        Login to save replays
      </div>
    );
  }

  return (
    <Button
      onClick={handleSaveReplay}
      disabled={status === 'saving' || status === 'processing'}
      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm"
    >
      {status === 'saving' || status === 'processing' ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {status === 'saving' ? 'Saving...' : 'Processing...'}
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Save Replay
        </>
      )}
    </Button>
  );
}


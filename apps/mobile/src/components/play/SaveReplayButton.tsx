import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveReplay, getReplayStatus } from '@/lib/api-client';
import { t } from '@/lib/i18n';
import type { ReplayRequest } from '@/types';

const SaveIcon = () => <Text style={{ fontSize: 20 }}>💾</Text>;
const CheckIcon = () => <Text style={{ fontSize: 20, color: '#10B981' }}>✓</Text>;
const AlertIcon = () => <Text style={{ fontSize: 20, color: '#EF4444' }}>⚠️</Text>;

interface SaveReplayButtonProps {
  sessionId: string;
  gameId: string;
}

export function SaveReplayButton({
  sessionId,
  gameId,
}: SaveReplayButtonProps) {
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'processing' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSaveReplay = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setStatus('saving');
    setError(null);

    try {
      const request: ReplayRequest = {
        sessionId,
        userId: 'user_123', // TODO: Get from auth context
        gameId,
        qualityPreset: 'high',
      };

      const response = await saveReplay(request);

      if (response.status === 'ready') {
        setStatus('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setStatus('processing');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Poll for status
        pollReplayStatus(response.replayId);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : t('play.error'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const pollReplayStatus = async (replayId: string) => {
    const maxAttempts = 10;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const statusResponse = await getReplayStatus(replayId);
        if (statusResponse.status === 'ready') {
          setStatus('success');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearInterval(interval);
        } else if (
          statusResponse.status === 'failed' ||
          attempts >= maxAttempts
        ) {
          setStatus('error');
          setError(t('play.error'));
          clearInterval(interval);
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          setStatus('error');
          setError(t('play.error'));
          clearInterval(interval);
        }
      }
    }, 3000);
  };

  if (status === 'success') {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <CheckIcon />
        <Text style={styles.successText}>{t('play.saved')}</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.errorButton]}>
          <AlertIcon />
          <Text style={styles.errorText}>
            {error || t('play.error')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={handleSaveReplay}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.saveButton]}
      onPress={handleSaveReplay}
      disabled={status === 'saving' || status === 'processing'}
    >
      {status === 'saving' || status === 'processing' ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.buttonText}>
            {status === 'saving' ? t('play.saving') : t('play.processing')}
          </Text>
        </>
      ) : (
        <>
          <SaveIcon />
          <Text style={styles.buttonText}>{t('play.saveReplay')}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backdropFilter: 'blur(10px)',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});


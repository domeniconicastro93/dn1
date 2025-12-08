import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { WebBrowser } from 'expo-web-browser';
import { CloudGamingPlayer } from '@/components/play/CloudGamingPlayer';
import { SaveReplayButton } from '@/components/play/SaveReplayButton';
import { t } from '@/lib/i18n';
import type { GameSession } from '@/types';

export function PlayScreen() {
  const route = useRoute();
  const { gameId, sessionId } = (route.params as {
    gameId?: string;
    sessionId?: string;
  }) || {};

  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual session creation/fetch
    if (!gameId) {
      setError('No game selected');
      setLoading(false);
      return;
    }

    // Mock session creation
    setTimeout(() => {
      setSession({
        id: sessionId || `session_${Date.now()}`,
        gameId,
        userId: 'user_123',
        streamUrl: 'wss://stream.strike.gg/mock',
        controlChannelUrl: 'wss://control.strike.gg/mock',
        status: 'active',
        startedAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 1000);
  }, [gameId, sessionId]);

  // For Phase 3, use WebView as placeholder
  const handleOpenInBrowser = () => {
    WebBrowser.openBrowserAsync(
      `https://strike.gg/play?gameId=${gameId}&sessionId=${session?.id}`
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Starting your gaming session...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Session not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenInBrowser}>
          <Text style={styles.buttonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CloudGamingPlayer session={session} />
      <View style={styles.replayButtonContainer}>
        <SaveReplayButton sessionId={session.id} gameId={session.gameId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#080427',
    fontSize: 16,
    fontWeight: '600',
  },
  replayButtonContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
});


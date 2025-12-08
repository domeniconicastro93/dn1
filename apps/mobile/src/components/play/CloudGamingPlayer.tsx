import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebBrowser } from 'expo-web-browser';
import type { GameSession } from '@/types';

interface CloudGamingPlayerProps {
  session: GameSession;
}

export function CloudGamingPlayer({ session }: CloudGamingPlayerProps) {
  const [showControls, setShowControls] = useState(true);

  // TODO: Replace with actual WebRTC implementation in Phase 5
  // For Phase 3, show placeholder with option to open in browser

  const handleOpenInBrowser = async () => {
    await WebBrowser.openBrowserAsync(
      `https://strike.gg/play?sessionId=${session.id}&streamUrl=${encodeURIComponent(session.streamUrl)}`
    );
  };

  return (
    <View style={styles.container}>
      {/* Placeholder overlay */}
      <View style={styles.placeholderOverlay}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.placeholderText}>Connecting to game server...</Text>
        <Text style={styles.placeholderSubtext}>
          Session ID: {session.id}
        </Text>
        <TouchableOpacity
          style={styles.browserButton}
          onPress={handleOpenInBrowser}
        >
          <Text style={styles.browserButtonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>

      {/* Controls overlay */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowControls(false)}
          >
            <Text style={styles.controlText}>Hide Controls</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  placeholderOverlay: {
    flex: 1,
    backgroundColor: '#080427',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  browserButton: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browserButtonText: {
    color: '#080427',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});


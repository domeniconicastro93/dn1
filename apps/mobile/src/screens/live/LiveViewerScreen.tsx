import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { LiveStream } from '@/types';

const ArrowLeftIcon = () => <Text style={{ fontSize: 24, color: '#FFFFFF' }}>←</Text>;

export function LiveViewerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { streamId } = (route.params as { streamId: string }) || {};

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call and HLS/WebRTC player
    setLoading(false);
  }, [streamId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Stream not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeftIcon />
      </TouchableOpacity>

      {/* TODO: Implement actual HLS/WebRTC player in Phase 5 */}
      <View style={styles.placeholderContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.placeholderText}>Loading stream...</Text>
        <Text style={styles.placeholderSubtext}>{stream.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
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
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});


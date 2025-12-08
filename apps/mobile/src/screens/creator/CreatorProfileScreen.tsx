import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { t } from '@/lib/i18n';
import type { Creator } from '@/types';

export function CreatorProfileScreen() {
  const route = useRoute();
  const { handle } = (route.params as { handle: string }) || {};

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    setLoading(false);
  }, [handle]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!creator) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Creator not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {creator.avatarUrl && (
          <Image source={{ uri: creator.avatarUrl }} style={styles.avatar} />
        )}
        <Text style={styles.displayName}>{creator.displayName}</Text>
        <Text style={styles.handle}>@{creator.handle}</Text>
        {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {creator.followerCount.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {creator.clipCount.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Clips</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
  },
  displayName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  handle: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  bio: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});


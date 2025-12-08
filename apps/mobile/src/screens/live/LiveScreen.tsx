import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { t } from '@/lib/i18n';
import type { LiveStream } from '@/types';

const EyeIcon = () => <Text style={{ fontSize: 16 }}>👁️</Text>;

export function LiveScreen() {
  const navigation = useNavigation();
  const [streams, setStreams] = useState<LiveStream[]>([]);

  // TODO: Replace with actual API call

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.live')}</Text>
        <Text style={styles.description}>Watch the best streamers live now</Text>
      </View>

      {streams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No live streams at the moment</Text>
        </View>
      ) : (
        <FlatList
          data={streams}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.streamCard}
              onPress={() => {
                navigation.navigate('LiveViewer', { streamId: item.id });
              }}
            >
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.thumbnail}
                />
                <View style={styles.liveBadge}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <View style={styles.viewerCount}>
                  <EyeIcon />
                  <Text style={styles.viewerText}>
                    {item.viewerCount.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.streamInfo}>
                <Text style={styles.streamTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.creatorHandle}>@{item.creatorHandle}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
  },
  header: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  listContent: {
    padding: 8,
  },
  streamCard: {
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  streamInfo: {
    padding: 12,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  creatorHandle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});


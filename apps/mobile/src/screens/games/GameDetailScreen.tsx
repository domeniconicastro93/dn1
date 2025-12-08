import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { t } from '@/lib/i18n';
import type { Game } from '@/types';

const PlayIcon = () => <Text style={{ fontSize: 24 }}>▶️</Text>;

export function GameDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { slug } = (route.params as { slug: string }) || {};

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {game.coverImageUrl && (
        <Image source={{ uri: game.coverImageUrl }} style={styles.coverImage} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description}</Text>

        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            navigation.navigate('Play', { gameId: game.id });
          }}
        >
          <PlayIcon />
          <Text style={styles.playButtonText}>{t('common.playNow')}</Text>
        </TouchableOpacity>

        {game.genre && game.genre.length > 0 && (
          <View style={styles.genreContainer}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <Text style={styles.genreText}>{game.genre.join(', ')}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
  },
  coverImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#1F2937',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#080427',
  },
  genreContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  genreText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});


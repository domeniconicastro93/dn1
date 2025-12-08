import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import type { Game } from '@/types';

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: game.thumbnailUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {game.title}
        </Text>
        {game.genre && game.genre.length > 0 && (
          <Text style={styles.genre} numberOfLines={1}>
            {game.genre[0]}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1F2937',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  genre: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});


import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GameCard } from '@/components/games/GameCard';
import { t } from '@/lib/i18n';
import type { Game } from '@/types';

export function GamesScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);

  // TODO: Replace with actual API call

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('games.title')}</Text>
        <Text style={styles.description}>{t('games.description')}</Text>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={t('games.searchPlaceholder')}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {games.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No games available yet</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              onPress={() => {
                navigation.navigate('GameDetail', { slug: item.slug });
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
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
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  listContent: {
    padding: 8,
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


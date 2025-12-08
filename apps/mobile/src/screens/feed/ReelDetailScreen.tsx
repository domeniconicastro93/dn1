import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export function ReelDetailScreen() {
  const route = useRoute();
  const { clipId } = route.params as { clipId: string };

  // TODO: Fetch clip details and render full-screen player

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reel Detail: {clipId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});


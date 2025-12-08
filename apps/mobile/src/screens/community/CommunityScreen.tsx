import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { t } from '@/lib/i18n';

export function CommunityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('nav.community')}</Text>
      <Text style={styles.description}>Community features coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});


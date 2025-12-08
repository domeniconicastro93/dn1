/**
 * Simple Icon component for React Native
 * In production, use react-native-vector-icons or similar
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  fill?: string;
}

// Simple placeholder icons using View
// TODO: Replace with proper icon library (react-native-vector-icons)
export function Icon({ name, size = 24, color = '#FFFFFF' }: IconProps) {
  // For Phase 3, return a simple colored square as placeholder
  // In production, map icon names to actual SVG/vector icons
  return (
    <View
      style={[
        styles.icon,
        { width: size, height: size, backgroundColor: color },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: 2,
  },
});


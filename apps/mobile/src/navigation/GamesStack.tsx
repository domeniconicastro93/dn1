import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GamesScreen } from '@/screens/games/GamesScreen';
import { GameDetailScreen } from '@/screens/games/GameDetailScreen';
import { PlayScreen } from '@/screens/play/PlayScreen';

const Stack = createNativeStackNavigator();

export function GamesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#080427' },
      }}
    >
      <Stack.Screen name="GamesMain" component={GamesScreen} />
      <Stack.Screen name="GameDetail" component={GameDetailScreen} />
      <Stack.Screen name="Play" component={PlayScreen} />
    </Stack.Navigator>
  );
}


import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LiveScreen } from '@/screens/live/LiveScreen';
import { LiveViewerScreen } from '@/screens/live/LiveViewerScreen';

const Stack = createNativeStackNavigator();

export function LiveStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#080427' },
      }}
    >
      <Stack.Screen name="LiveMain" component={LiveScreen} />
      <Stack.Screen name="LiveViewer" component={LiveViewerScreen} />
    </Stack.Navigator>
  );
}


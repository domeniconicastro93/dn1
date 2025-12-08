import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '@/screens/feed/FeedScreen';
import { ReelDetailScreen } from '@/screens/feed/ReelDetailScreen';
import { CreatorProfileScreen } from '@/screens/creator/CreatorProfileScreen';

const Stack = createNativeStackNavigator();

export function FeedStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#080427' },
      }}
    >
      <Stack.Screen name="FeedMain" component={FeedScreen} />
      <Stack.Screen name="ReelDetail" component={ReelDetailScreen} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
    </Stack.Navigator>
  );
}


import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityScreen } from '@/screens/community/CommunityScreen';

const Stack = createNativeStackNavigator();

export function CommunityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#080427' },
      }}
    >
      <Stack.Screen name="CommunityMain" component={CommunityScreen} />
    </Stack.Navigator>
  );
}


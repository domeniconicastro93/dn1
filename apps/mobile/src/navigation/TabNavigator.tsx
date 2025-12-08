import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { FeedStack } from './FeedStack';
import { GamesStack } from './GamesStack';
import { LiveStack } from './LiveStack';
import { CommunityStack } from './CommunityStack';
import { ProfileStack } from './ProfileStack';
import { t } from '@/lib/i18n';

// Simple icon component (placeholder)
// TODO: Replace with proper icon library
const TabIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  return <Text style={{ color, fontSize: size }}>{name}</Text>;
};

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#080427',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="🏠" color={color} size={size} />,
          tabBarLabel: t('nav.feed'),
        }}
      />
      <Tab.Screen
        name="Live"
        component={LiveStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="📡" color={color} size={size} />,
          tabBarLabel: t('nav.live'),
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="🎮" color={color} size={size} />,
          tabBarLabel: t('nav.games'),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="👥" color={color} size={size} />,
          tabBarLabel: t('nav.community'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="👤" color={color} size={size} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}


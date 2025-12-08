import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const UserIcon = () => <Text style={{ fontSize: 48 }}>👤</Text>;
const SettingsIcon = () => <Text style={{ fontSize: 24 }}>⚙️</Text>;

export function ProfileScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <UserIcon />
        </View>
        <Text style={styles.username}>@username</Text>
        <Text style={styles.email}>user@example.com</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <SettingsIcon />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080427',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});


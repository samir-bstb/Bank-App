import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();

    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 40, color: 'blue' }}>
        HOME SCREEN
      </Text>
      <Text style={styles.title}>
        Welcome {user?.username}
      </Text>

      <Text style={styles.subtitle}>
        Role: {user?.role}
      </Text>

      <Button
        title="Logout"
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
});
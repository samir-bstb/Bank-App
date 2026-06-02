import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

import Input from '../components/Input';
import Button from '../components/Button';

import { loginRequest } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const response = await loginRequest(
        username,
        password
      );

      await login(
        response.token,
        response.user
      );

      router.replace('/home');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'unknown_error';

      if (message === 'account_blocked') {
        Alert.alert(
          'Account Locked',
          'Please contact the administrator.'
        );
      } else if (
        message === 'invalid_credentials'
      ) {
        Alert.alert(
          'Login Failed',
          'Invalid username or password.'
        );
      } else {
        Alert.alert(
          'Error',
          'Unable to login.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
        <View style={styles.card}>
        <Text style={styles.title}>
            Bank App
        </Text>

        <Text style={styles.subtitle}>
            Sign in to continue
        </Text>

        <Input
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
        />

        <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
        />

        <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
        />
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
});
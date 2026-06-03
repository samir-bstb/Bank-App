import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';

import {
  useEffect,
  useState,
} from 'react';

import { router } from 'expo-router';

import Button from '../components/Button';

import { useAuth } from '../hooks/useAuth';

import {
  getAccounts,
} from '../services/accounts';

export default function HomeScreen() {
  const {
    user,
    token,
    logout,
  } = useAuth();

  const [balance, setBalance] =
    useState<number | null>(null);

  const [accountNumber, setAccountNumber] =
    useState('');

  const [loadingAccount, setLoadingAccount] =
    useState(true);

  useEffect(() => {
    if (token) {
      loadAccount();
    }
  }, [token]);

  async function loadAccount() {
    try {
      const accounts =
        await getAccounts(token!);

      console.log(
        'Accounts response:',
        accounts
      );

      if (accounts.length > 0) {
        setBalance(
          accounts[0].balance
        );

        setAccountNumber(
          accounts[0].account_number
        );
      }
    } catch (error) {
      console.error(
        'Error loading account:',
        error
      );
    } finally {
      setLoadingAccount(false);
    }
  }

  function handleTransfer() {
    router.push('/transfer');
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(
          'Are you sure you want to logout?'
        );

      if (!confirmed) {
        return;
      }

      performLogout();

      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            performLogout();
          },
        },
      ]
    );
  }

  async function performLogout() {
    await logout();

    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome {user?.username}
      </Text>

      <Text style={styles.subtitle}>
        Role: {user?.role}
      </Text>

      <Text style={styles.subtitle}>
        Account Number:{' '}
        {loadingAccount
          ? 'Loading...'
          : accountNumber}
      </Text>

      <Text style={styles.balance}>
        Balance:{' '}
        {loadingAccount
          ? 'Loading...'
          : `$${balance?.toFixed(2)}`}
      </Text>

      <Button
        title="Transfer"
        onPress={handleTransfer}
      />

      <View style={styles.spacing} />

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
    marginBottom: 12,
  },

  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },

  spacing: {
    height: 12,
  },
});

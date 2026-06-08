import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { getAccounts } from '../services/accounts';
import { transferFunds } from '../services/transactions';

const ERROR_MESSAGES: Record<string, string> = {
  receiver_account_not_found: 'Recipient account not found or inactive.',
  insufficient_funds: 'Insufficient funds in your account.',
  self_transfer_not_allowed: 'You cannot transfer to your own account.',
  invalid_amount: 'Please enter a valid amount greater than 0.',
  missing_required_fields: 'All fields are required.',
  transfer_failed: 'Transfer failed. Please try again.',
};

export default function TransferScreen() {
  const { token } = useAuth();

  const [senderAccountId, setSenderAccountId] = useState('');
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [receiverAccountId, setReceiverAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function loadAccount() {
      try {
        const accounts = await getAccounts(token!);
        if (accounts.length > 0) {
          setSenderAccountId(accounts[0].id);
          setSenderAccountNumber(accounts[0].account_number);
        }
      } catch {
        Alert.alert('Error', 'Could not load your account.');
      } finally {
        setLoadingAccount(false);
      }
    }
    loadAccount();
  }, [token]);

  async function handleTransfer() {
    if (!token) return;

    if (!receiverAccountId.trim()) {
      showAlert('Error', 'Please enter the recipient account ID.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert('Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      await transferFunds(token, senderAccountId, receiverAccountId.trim(), parsedAmount);
      showAlert('Success', 'Transfer completed successfully!', () => {
        router.replace('/home');
      });
    } catch (e: any) {
      const message = ERROR_MESSAGES[e.message] ?? 'An unexpected error occurred.';
      showAlert('Transfer Failed', message);
    } finally {
      setLoading(false);
    }
  }

  function showAlert(title: string, message: string, onOk?: () => void) {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  }

  if (loadingAccount) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Transfer Funds</Text>
        <Text style={styles.subtitle}>Transfer money to another account</Text>

        <View style={styles.fromAccount}>
          <Text style={styles.label}>From Account</Text>
          <Text style={styles.accountNumber}>{senderAccountNumber}</Text>
        </View>

        <Text style={styles.label}>Recipient Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="16-digit account number"
          value={receiverAccountId}
          onChangeText={setReceiverAccountId}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          maxLength={16}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Button
          title={loading ? 'Transferring...' : 'Transfer'}
          onPress={handleTransfer}
          loading={loading}
        />

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
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
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  fromAccount: {
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    color: '#666',
    fontSize: 16,
  },
});
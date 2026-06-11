import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getAccounts, type Account } from '../services/accounts';
import { getTransactions, transferFunds, type Transaction } from '../services/transactions';
import BottomTabs from '../components/BottomTabs';
import Skeleton from '../components/Skeleton';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

const ERROR_MAP: Record<string, string> = {
  receiver_account_not_found: 'Cuenta destinataria no encontrada.',
  insufficient_funds: 'Saldo insuficiente.',
  self_transfer_not_allowed: 'No puedes transferirte a ti mismo.',
  invalid_amount: 'Monto inválido.',
  missing_required_fields: 'Completa todos los campos.',
  transfer_failed: 'Error al procesar la transferencia.',
};

function relativeDate(dateStr: string): string {
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

function showMessage(title: string, msg: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${msg}`);
  } else {
    Alert.alert(title, msg);
  }
}

export default function TransferScreen() {
  const { token, user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function loadData() {
    try {
      const accounts = await getAccounts(token!);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const txs = await getTransactions(token!, accounts[0].id);
        setRecentTxs(txs.filter(tx => tx.sender_account_id === accounts[0].id).slice(0, 6));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer() {
    if (!account) return;
    if (!receiver.trim()) {
      showMessage('Error', 'Ingresa el número de cuenta destinataria.');
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      showMessage('Error', 'Ingresa un monto válido.');
      return;
    }
    setSending(true);
    try {
      await transferFunds(token!, account.id, receiver.trim(), parsed);
      showMessage('✅ Éxito', '¡Transferencia realizada con éxito!');
      setReceiver('');
      setAmount('');
      setShowForm(false);
      loadData();
    } catch (e: unknown) {
      const key = e instanceof Error ? e.message : '';
      showMessage('❌ Error', ERROR_MAP[key] ?? 'Error inesperado.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Banco CCB</Text>
            <Text style={styles.headerSub}>Transferencias</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.username?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* From account — card renders immediately, values skeleton while loading */}
        <View style={styles.fromCard}>
          <Text style={styles.fromLabel}>CUENTA ORIGEN</Text>
          {loading ? (
            <>
              <Skeleton width={180} height={16} radius={7} light style={{ marginBottom: 8 }} />
              <Skeleton width={130} height={13} radius={6} light />
            </>
          ) : (
            <>
              <Text style={styles.fromNumber}>
                •••• •••• •••• {account?.account_number.slice(-4)}
              </Text>
              <Text style={styles.fromBalance}>
                Saldo: ${account?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </>
          )}
        </View>

        {/* New transfer button — always visible */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setShowForm(f => !f)}
          activeOpacity={0.85}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          <Text style={styles.newBtnText}>
            {showForm ? 'Cancelar' : 'Nueva Transferencia'}
          </Text>
        </TouchableOpacity>

        {/* Transfer form */}
        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos del envío</Text>

            <Text style={styles.fieldLabel}>N.º de cuenta destinatario (16 dígitos)</Text>
            <TextInput
              style={styles.input}
              placeholder="0000000000000000"
              placeholderTextColor="#9E9E9E"
              value={receiver}
              onChangeText={setReceiver}
              keyboardType="number-pad"
              maxLength={16}
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Monto a transferir</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9E9E9E"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[styles.sendBtn, sending && { opacity: 0.6 }]}
              onPress={handleTransfer}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>Confirmar Envío</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Recent transfers — card always shown, rows skeleton while loading */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transferencias Enviadas</Text>

          {loading ? (
            [1, 2, 3].map(i => (
              <View key={i} style={[styles.recentRow, i < 3 && styles.rowBorder]}>
                <Skeleton width={40} height={40} radius={20} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="55%" height={13} radius={6} />
                  <Skeleton width="28%" height={11} radius={5} />
                </View>
                <Skeleton width={58} height={14} radius={6} />
              </View>
            ))
          ) : recentTxs.length === 0 ? (
            <Text style={styles.emptyText}>Sin transferencias enviadas aún</Text>
          ) : (
            recentTxs.map((tx, i) => (
              <TouchableOpacity
                key={tx.id}
                style={[styles.recentRow, i < recentTxs.length - 1 && styles.rowBorder]}
                onPress={() => { setReceiver(tx.receiver_account_id); setShowForm(true); }}
                activeOpacity={0.7}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="swap-horizontal" size={18} color={PRIMARY} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>Transferencia enviada</Text>
                  <Text style={styles.recentDate}>{relativeDate(tx.created_at)}</Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={styles.recentAmount}>-${tx.amount.toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#BDBDBD" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabs active="transfer" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, marginBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1C1D' },
  headerSub: { fontSize: 12, color: '#767683', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  fromCard: { backgroundColor: PRIMARY, borderRadius: 16, padding: 18, marginBottom: 12 },
  fromLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  fromNumber: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  fromBalance: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PRIMARY, borderRadius: 50, height: 50, marginBottom: 12,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  newBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1C1D', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#454652', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E2E4', borderRadius: 10,
    padding: 14, fontSize: 15, color: '#1A1C1D', backgroundColor: '#FAFAFA', marginBottom: 4,
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PRIMARY, borderRadius: 50, height: 50, marginTop: 16,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  recentIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center',
  },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: '#1A1C1D', marginBottom: 2 },
  recentDate: { fontSize: 12, color: '#9E9E9E' },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: '#1A1C1D' },
  emptyText: { textAlign: 'center', color: '#9E9E9E', paddingVertical: 20, fontSize: 14 },
});

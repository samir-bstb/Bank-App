import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { getAccounts, type Account } from '../services/accounts';
import { getTransactions, type Transaction } from '../services/transactions';
import BottomTabs from '../components/BottomTabs';
import Skeleton from '../components/Skeleton';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';
const SUCCESS = '#4CAF50';

function relativeDate(dateStr: string): string {
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

const TX_BG = ['#E8EAF6', '#E8F5E9', '#FFF8E1', '#F3E5F5', '#FBE9E7'];
const TX_COLOR = [PRIMARY, '#2E7D32', '#F57F17', '#6A1B9A', '#BF360C'];

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin');
      return;
    }
    if (token) loadData();
  }, [token, user]);

  async function loadData() {
    try {
      const accounts = await getAccounts(token!);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const txs = await getTransactions(token!, accounts[0].id);
        setTransactions(txs.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — user data available immediately from auth */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bankLabel}>Banco CCB</Text>
            <Text style={styles.greeting}>Hola, {user?.username}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.username?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Balance card — structure immediate, data fields skeleton */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO TOTAL</Text>

          {loading ? (
            <Skeleton width={200} height={38} radius={8} light style={{ marginBottom: 4 }} />
          ) : (
            <Text style={styles.balanceAmount}>
              ${(account?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          )}

          <Text style={styles.balanceSub}>Cuenta de Ahorros</Text>

          {loading ? (
            <Skeleton width={120} height={28} radius={99} light />
          ) : account ? (
            <View style={styles.accountChip}>
              <Ionicons name="card-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.accountChipText}>
                •••• {account.account_number.slice(-4)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Quick actions — no data needed, renders immediately */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/transfer')}>
              <View style={[styles.actionCircle, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="arrow-up-outline" size={22} color={PRIMARY} />
              </View>
              <Text style={styles.actionLabel}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions — card shows immediately, rows skeleton while loading */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Movimientos Recientes</Text>

          {loading ? (
            [1, 2, 3].map(i => (
              <View key={i} style={[styles.txRow, i < 3 && styles.txBorder]}>
                <Skeleton width={42} height={42} radius={21} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="58%" height={13} radius={6} />
                  <Skeleton width="32%" height={11} radius={5} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Skeleton width={62} height={14} radius={6} />
                  <Skeleton width={50} height={18} radius={99} />
                </View>
              </View>
            ))
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>Sin movimientos aún</Text>
          ) : (
            transactions.map((tx, i) => {
              const isIncoming = tx.receiver_account_id === account?.id;
              return (
                <View
                  key={tx.id}
                  style={[styles.txRow, i < transactions.length - 1 && styles.txBorder]}
                >
                  <View style={[styles.txIcon, { backgroundColor: TX_BG[i % TX_BG.length] }]}>
                    <Ionicons
                      name={isIncoming ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={TX_COLOR[i % TX_COLOR.length]}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>
                      {isIncoming ? 'Transferencia recibida' : 'Transferencia enviada'}
                    </Text>
                    <Text style={styles.txDate}>{relativeDate(tx.created_at)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: isIncoming ? SUCCESS : '#1A1C1D' }]}>
                      {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{tx.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabs active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bankLabel: { fontSize: 18, fontWeight: '800', color: '#1A1C1D' },
  greeting: { fontSize: 12, color: '#767683', marginTop: 2 },

  balanceCard: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  balanceAmount: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 4 },
  balanceSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 },
  accountChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  accountChipText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1C1D', marginBottom: 16 },

  actionsRow: { flexDirection: 'row' },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, color: '#454652', fontWeight: '500' },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  txIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '600', color: '#1A1C1D', marginBottom: 2 },
  txDate: { fontSize: 12, color: '#9E9E9E' },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },
  emptyText: { textAlign: 'center', color: '#9E9E9E', paddingVertical: 20, fontSize: 14 },
});

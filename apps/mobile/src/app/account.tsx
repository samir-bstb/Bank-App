import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getAccounts, type Account } from '../services/accounts';
import BottomTabs from '../components/BottomTabs';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

function maskNumber(num: string): string {
  return '•••• •••• •••• ' + num.slice(-4);
}

function formatRef(accountNumber: string): string {
  const parts = accountNumber.match(/.{1,4}/g) ?? [];
  return 'CCB ' + parts.join(' ');
}

export default function AccountScreen() {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (token) {
      getAccounts(token)
        .then(accounts => {
          if (accounts.length > 0) setAccount(accounts[0]);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  async function handleShare() {
    if (!account) return;
    try {
      await Share.share({
        message:
          `Mis datos bancarios – Banco CCB\n` +
          `Titular: ${user?.username ?? ''}\n` +
          `N.º de cuenta: ${account.account_number}\n` +
          `Banco: Banco CCB`,
      });
    } catch {
      // share cancelled
    }
  }

  function handleDownload() {
    const msg = 'Estado de cuenta disponible próximamente.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Próximamente', msg);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Banco CCB</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.username?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.username?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#69F0AE" />
            <Text style={styles.verifiedText}>VERIFICADO</Text>
          </View>
          <Text style={styles.profileName}>{user?.username}</Text>
          <Text style={styles.profileRole}>Cuenta de Ahorros · Banco CCB</Text>
        </View>

        {/* Account details */}
        {account && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DETALLES DE LA CUENTA</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Titular</Text>
              <Text style={styles.detailValue}>{user?.username}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>N.º de cuenta</Text>
              <View style={styles.detailValueRow}>
                <Text style={styles.detailValue}>
                  {revealed ? account.account_number : maskNumber(account.account_number)}
                </Text>
                <TouchableOpacity onPress={() => setRevealed(r => !r)}>
                  <Ionicons
                    name={revealed ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#767683"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Referencia CCB</Text>
              <Text style={[styles.detailValue, { fontSize: 12 }]}>
                {formatRef(account.account_number)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Saldo disponible</Text>
              <Text style={[styles.detailValue, styles.balanceValue]}>
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={[styles.detailRow, styles.lastRow]}>
              <Text style={styles.detailLabel}>Tipo de cuenta</Text>
              <Text style={styles.detailValue}>Cuenta de Ahorros</Text>
            </View>
          </View>
        )}

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#1565C0" />
          <Text style={styles.securityText}>
            Nunca compartas tu contraseña. Banco CCB jamás te la solicitará por mensaje o llamada.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Compartir Datos de Cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownload} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={18} color={PRIMARY} />
          <Text style={styles.secondaryBtnText}>Descargar Estado de Cuenta</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabs active="account" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1C1D' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  profileCard: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  profileAvatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1.2 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  profileRole: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767683',
    letterSpacing: 1,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  lastRow: { borderBottomWidth: 0 },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, color: '#767683' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1A1C1D' },
  balanceValue: { color: '#2E7D32', fontSize: 16 },

  securityNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  securityText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 18 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 50,
    height: 52,
    marginBottom: 10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 50,
    height: 52,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  secondaryBtnText: { color: PRIMARY, fontSize: 15, fontWeight: '700' },
});

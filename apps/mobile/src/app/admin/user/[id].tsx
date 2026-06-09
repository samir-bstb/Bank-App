import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { adminGetUser, adminToggleBlock, type AdminUserDetail } from '../../../services/admin';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (token && id) {
      adminGetUser(token, id)
        .then(setUser)
        .catch(() => showMsg('Error', 'No se pudo cargar el usuario.'))
        .finally(() => setLoading(false));
    }
  }, [id, token]);

  function showMsg(title: string, msg: string) {
    if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  }

  async function handleToggleBlock() {
    if (!user) return;
    const action = user.is_blocked ? 'desbloquear' : 'bloquear';
    const confirm = () => performToggle();
    if (Platform.OS === 'web') {
      if (window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.username}?`)) confirm();
    } else {
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} usuario`,
        `¿Estás seguro de que quieres ${action} a ${user.username}?`,
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: confirm }],
      );
    }
  }

  async function performToggle() {
    if (!user) return;
    setToggling(true);
    try {
      await adminToggleBlock(token!, user.id, !user.is_blocked);
      setUser({ ...user, is_blocked: !user.is_blocked, failed_attempts: 0 });
    } catch {
      showMsg('Error', 'No se pudo actualizar el estado.');
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#1A1C1D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.username}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user.username[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{user.username}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: user.is_blocked ? '#FFEBEE' : '#E8F5E9' },
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: user.is_blocked ? '#C62828' : '#2E7D32' },
            ]} />
            <Text style={[styles.statusText, { color: user.is_blocked ? '#C62828' : '#2E7D32' }]}>
              {user.is_blocked ? 'Bloqueado' : 'Activo'}
            </Text>
          </View>
        </View>

        {/* Profile details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PERFIL</Text>
          <Row label="Rol" value={user.role} />
          <Row label="Intentos fallidos" value={String(user.failed_attempts)} />
          <Row
            label="Estado"
            value={user.is_blocked ? 'Bloqueado' : 'Activo'}
            valueColor={user.is_blocked ? '#C62828' : '#2E7D32'}
          />
          <View style={[styles.detailRow, styles.lastRow]}>
            <Text style={styles.detailLabel}>Registrado</Text>
            <Text style={styles.detailValue}>{new Date(user.created_at).toLocaleDateString('es')}</Text>
          </View>
        </View>

        {/* Account details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>CUENTA BANCARIA</Text>
          {user.account ? (
            <>
              <Row label="N.º de cuenta" value={user.account.account_number} />
              <Row label="Saldo" value={`$${user.account.balance.toFixed(2)}`} />
              <View style={[styles.detailRow, styles.lastRow]}>
                <Text style={styles.detailLabel}>Activa</Text>
                <Text style={styles.detailValue}>{user.account.is_active ? 'Sí' : 'No'}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Sin cuenta bancaria registrada</Text>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: user.is_blocked ? '#2E7D32' : '#C62828' }]}
          onPress={handleToggleBlock}
          disabled={toggling}
          activeOpacity={0.85}
        >
          {toggling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={user.is_blocked ? 'lock-open-outline' : 'ban-outline'}
                size={18}
                color="#fff"
              />
              <Text style={styles.actionBtnText}>
                {user.is_blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logsBtn}
          onPress={() => router.push(`/admin/logs?user_id=${user.id}` as never)}
          activeOpacity={0.85}
        >
          <Ionicons name="list-outline" size={18} color={PRIMARY} />
          <Text style={styles.logsBtnText}>Ver registros de {user.username}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1C1D' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },

  content: { padding: 16, gap: 12 },

  profileCard: {
    backgroundColor: PRIMARY, borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  profileAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  profileAvatarText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 10 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#767683', letterSpacing: 1, marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  lastRow: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 13, color: '#767683' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1A1C1D' },
  emptyText: { fontSize: 13, color: '#9E9E9E', fontStyle: 'italic', paddingVertical: 8 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 50, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 50, height: 52, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  logsBtnText: { color: PRIMARY, fontSize: 15, fontWeight: '700' },
});

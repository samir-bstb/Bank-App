import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { adminGetUsers, adminGetLogs, type AdminUser, type AdminLog } from '../../services/admin';
import AdminBottomTabs from '../../components/AdminBottomTabs';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

const EVENT_COLORS: Record<string, { bg: string; color: string }> = {
  login_success: { bg: '#E8F5E9', color: '#2E7D32' },
  login_failed: { bg: '#FFEBEE', color: '#C62828' },
  login_blocked: { bg: '#FFEBEE', color: '#C62828' },
  transfer: { bg: '#E3F2FD', color: '#1565C0' },
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      Promise.all([adminGetUsers(token), adminGetLogs(token)])
        .then(([u, l]) => {
          setUsers(u);
          setLogs(l.slice(0, 8));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const blockedCount = users.filter(u => u.is_blocked).length;
  const clientCount = users.filter(u => u.role === 'client').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bankName}>Banco CCB</Text>
            <Text style={styles.headerSub}>Panel de Administración</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={async () => { await logout(); router.replace('/login'); }}
          >
            <Text style={styles.avatarText}>
              {(user?.username?.[0] ?? 'A').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* System status */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={styles.statusDot} />
            <View>
              <Text style={styles.statusTitle}>Estado del Sistema</Text>
              <Text style={styles.statusSub}>Todos los servicios operativos</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logsChip}
            onPress={() => router.push('/admin/logs')}
          >
            <Ionicons name="list-outline" size={14} color="#fff" />
            <Text style={styles.logsChipText}>Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Stats grid */}
        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="people" size={24} color={PRIMARY} />
              <Text style={styles.statNum}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Usuarios</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person-circle" size={24} color="#2E7D32" />
              <Text style={[styles.statNum, { color: '#2E7D32' }]}>{clientCount}</Text>
              <Text style={styles.statLabel}>Clientes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="ban" size={24} color="#C62828" />
              <Text style={[styles.statNum, { color: '#C62828' }]}>{blockedCount}</Text>
              <Text style={styles.statLabel}>Bloqueados</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="shield" size={24} color="#F57F17" />
              <Text style={[styles.statNum, { color: '#F57F17' }]}>{adminCount}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
          </View>
        )}

        {/* Recent users */}
        {!loading && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Usuarios Recientes</Text>
              <TouchableOpacity onPress={() => router.push('/admin/users')}>
                <Text style={styles.viewAll}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {users.slice(0, 4).map((u, i) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.userRow, i < 3 && styles.rowBorder]}
                onPress={() => router.push(`/admin/user/${u.id}` as never)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.username[0].toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.username}</Text>
                  <Text style={styles.userRole}>{u.role}</Text>
                </View>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: u.is_blocked ? '#FFEBEE' : '#E8F5E9' },
                ]}>
                  <Text style={[styles.statusPillText, { color: u.is_blocked ? '#C62828' : '#2E7D32' }]}>
                    {u.is_blocked ? 'Bloqueado' : 'Activo'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Security logs */}
        {!loading && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Registros de Seguridad</Text>
              <TouchableOpacity onPress={() => router.push('/admin/logs')}>
                <Text style={styles.viewAll}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>Sin registros aún</Text>
            ) : (
              logs.slice(0, 5).map((log, i) => {
                const ec = EVENT_COLORS[log.event_type] ?? { bg: '#F5F5F5', color: '#616161' };
                return (
                  <View key={log.id} style={[styles.logRow, i < 4 && styles.rowBorder]}>
                    <View style={styles.logTop}>
                      <View style={[styles.logBadge, { backgroundColor: ec.bg }]}>
                        <Text style={[styles.logBadgeText, { color: ec.color }]}>
                          {log.event_type.replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text style={styles.logTime}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.logDesc} numberOfLines={1}>{log.description}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <AdminBottomTabs active="panel" />
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
  bankName: { fontSize: 18, fontWeight: '800', color: '#1A1C1D' },
  headerSub: { fontSize: 12, color: '#767683', marginTop: 2 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  statusCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: PRIMARY, borderRadius: 16, padding: 16, marginBottom: 12,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#69F0AE' },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  statusSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  logsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6,
  },
  logsChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statNum: { fontSize: 28, fontWeight: '800', color: PRIMARY },
  statLabel: { fontSize: 12, color: '#454652', fontWeight: '500', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1C1D' },
  viewAll: { fontSize: 13, color: PRIMARY, fontWeight: '600' },

  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1C1D' },
  userRole: { fontSize: 12, color: '#9E9E9E', textTransform: 'capitalize' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  logRow: { paddingVertical: 10, gap: 4 },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' },
  logBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  logDesc: { fontSize: 13, color: '#454652' },
  logTime: { fontSize: 11, color: '#9E9E9E' },
  emptyText: { textAlign: 'center', color: '#9E9E9E', padding: 16, fontSize: 14 },
});

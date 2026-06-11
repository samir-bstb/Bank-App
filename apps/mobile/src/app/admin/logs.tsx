import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { adminGetLogs, type AdminLog } from '../../services/admin';
import AdminBottomTabs from '../../components/AdminBottomTabs';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

const EVENT_COLORS: Record<string, { bg: string; color: string }> = {
  login_success: { bg: '#E8F5E9', color: '#2E7D32' },
  login_failed: { bg: '#FFEBEE', color: '#C62828' },
  login_blocked: { bg: '#FFEBEE', color: '#C62828' },
  transfer: { bg: '#E3F2FD', color: '#1565C0' },
};

function EventBadge({ type }: { type: string }) {
  const ec = EVENT_COLORS[type] ?? { bg: '#F5F5F5', color: '#616161' };
  return (
    <View style={[styles.badge, { backgroundColor: ec.bg }]}>
      <Text style={[styles.badgeText, { color: ec.color }]}>
        {type.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

export default function AdminLogsScreen() {
  const { user_id } = useLocalSearchParams<{ user_id?: string }>();
  const { token } = useAuth();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const isUserFilter = Boolean(user_id);

  useEffect(() => {
    if (token) {
      adminGetLogs(token, user_id)
        .then(setLogs)
        .catch(() => {
          const msg = 'No se pudieron cargar los registros.';
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('Error', msg);
        })
        .finally(() => setLoading(false));
    }
  }, [token, user_id]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (isUserFilter ? router.back() : router.replace('/admin'))}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#1A1C1D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isUserFilter ? 'Registros del usuario' : 'Registros del sistema'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={l => l.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowTop}>
                <EventBadge type={item.event_type} />
                <Text style={styles.rowTime}>
                  {new Date(item.created_at).toLocaleString('es', {
                    day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.rowDesc}>{item.description}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Sin registros encontrados</Text>
          }
        />
      )}

      {!isUserFilter && <AdminBottomTabs active="logs" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  rowTime: { fontSize: 11, color: '#9E9E9E' },
  rowDesc: { fontSize: 13, color: '#454652', lineHeight: 18 },
  emptyText: { textAlign: 'center', color: '#9E9E9E', marginTop: 40, fontSize: 14 },
});

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { adminGetLogs, type AdminLog } from '../../services/admin';

const EVENT_COLORS: Record<string, string> = {
  login_success: '#16A34A',
  login_failed: '#DC2626',
  login_blocked: '#DC2626',
  transfer: '#0066FF',
};

function EventBadge({ type }: { type: string }) {
  const color = EVENT_COLORS[type] ?? '#888';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{type.replace(/_/g, ' ')}</Text>
    </View>
  );
}

export default function AdminLogsScreen() {
  const { user_id } = useLocalSearchParams<{ user_id?: string }>();
  const { token } = useAuth();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: user_id ? 'User Logs' : 'All Logs' });
    fetchLogs();
  }, [user_id]);

  async function fetchLogs() {
    try {
      const data = await adminGetLogs(token!, user_id);
      setLogs(data);
    } catch {
      const msg = 'Could not load logs.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No logs found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(l) => l.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowTop}>
            <EventBadge type={item.event_type} />
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  empty: { fontSize: 16, color: '#888' },
  list: { padding: 16, backgroundColor: '#F5F7FA', flexGrow: 1 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  date: { fontSize: 11, color: '#999' },
  description: { fontSize: 13, color: '#444' },
});

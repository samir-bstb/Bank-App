import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { adminGetUsers, type AdminUser } from '../../services/admin';

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <View style={[styles.badge, blocked ? styles.badgeBlocked : styles.badgeActive]}>
      <Text style={styles.badgeText}>{blocked ? 'Blocked' : 'Active'}</Text>
    </View>
  );
}

export default function AdminUsersScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: 'Users' });
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const data = await adminGetUsers(token!);
      setUsers(data);
    } catch {
      const msg = 'Could not load users.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push(`/admin/user/${item.id}` as any)}
          activeOpacity={0.75}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
          <StatusBadge blocked={item.is_blocked} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, backgroundColor: '#F5F7FA', flexGrow: 1 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowLeft: { gap: 2 },
  username: { fontSize: 16, fontWeight: '600', color: '#111' },
  role: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeBlocked: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#111' },
});

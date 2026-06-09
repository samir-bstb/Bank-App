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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { adminGetUsers, type AdminUser } from '../../services/admin';
import AdminBottomTabs from '../../components/AdminBottomTabs';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

export default function AdminUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      adminGetUsers(token)
        .then(setUsers)
        .catch(() => {
          const msg = 'No se pudieron cargar los usuarios.';
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert('Error', msg);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/admin')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#1A1C1D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/admin/user/${item.id}` as never)}
              activeOpacity={0.75}
            >
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{item.username[0].toUpperCase()}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.username}</Text>
                <Text style={styles.rowRole}>{item.role}</Text>
              </View>
              <View style={[
                styles.badge,
                { backgroundColor: item.is_blocked ? '#FFEBEE' : '#E8F5E9' },
              ]}>
                <Text style={[styles.badgeText, { color: item.is_blocked ? '#C62828' : '#2E7D32' }]}>
                  {item.is_blocked ? 'Bloqueado' : 'Activo'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BDBDBD" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay usuarios registrados</Text>
          }
        />
      )}

      <AdminBottomTabs active="users" />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rowAvatarText: { fontSize: 16, fontWeight: '700', color: PRIMARY },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#1A1C1D', marginBottom: 2 },
  rowRole: { fontSize: 12, color: '#9E9E9E', textTransform: 'capitalize' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#9E9E9E', marginTop: 40, fontSize: 14 },
});

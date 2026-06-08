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
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { adminGetUser, adminToggleBlock, type AdminUserDetail } from '../../../services/admin';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const navigation = useNavigation();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  useEffect(() => {
    if (user) navigation.setOptions({ title: user.username });
  }, [user]);

  async function loadUser() {
    try {
      const data = await adminGetUser(token!, id);
      setUser(data);
    } catch {
      showAlert('Error', 'Could not load user.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleBlock() {
    if (!user) return;
    const action = user.is_blocked ? 'unblock' : 'block';
    const confirm = () => performToggle();

    if (Platform.OS === 'web') {
      if (window.confirm(`${action} ${user.username}?`)) confirm();
    } else {
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} user`,
        `Are you sure you want to ${action} ${user.username}?`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: confirm }],
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
      showAlert('Error', 'Could not update user status.');
    } finally {
      setToggling(false);
    }
  }

  function showAlert(title: string, msg: string) {
    if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Row label="Username" value={user.username} />
        <Row label="Role" value={user.role} />
        <Row label="Status" value={user.is_blocked ? 'Blocked' : 'Active'} highlight={user.is_blocked ? 'red' : 'green'} />
        <Row label="Failed attempts" value={String(user.failed_attempts)} />
        <Row label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bank Account</Text>
        {user.account ? (
          <>
            <Row label="Account number" value={user.account.account_number} />
            <Row label="Balance" value={`$${user.account.balance.toFixed(2)}`} />
            <Row label="Active" value={user.account.is_active ? 'Yes' : 'No'} />
          </>
        ) : (
          <Text style={styles.empty}>No account found</Text>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={[styles.blockBtn, user.is_blocked ? styles.unblockBtn : styles.blockBtnRed]}
        onPress={handleToggleBlock}
        disabled={toggling}
      >
        {toggling ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.blockBtnText}>
            {user.is_blocked ? 'Unblock User' : 'Block User'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logsBtn}
        onPress={() => router.push(`/admin/logs?user_id=${user.id}` as any)}
      >
        <Text style={styles.logsBtnText}>View Logs for {user.username}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: 'red' | 'green' }) {
  const valueColor = highlight === 'red' ? '#DC2626' : highlight === 'green' ? '#16A34A' : '#111';
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, backgroundColor: '#F5F7FA', flexGrow: 1, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600' },
  empty: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  blockBtn: { borderRadius: 10, padding: 16, alignItems: 'center' },
  blockBtnRed: { backgroundColor: '#DC2626' },
  unblockBtn: { backgroundColor: '#16A34A' },
  blockBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logsBtn: { borderRadius: 10, padding: 16, alignItems: 'center', backgroundColor: '#6C47FF' },
  logsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

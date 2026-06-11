import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import AdminBottomTabs from '../../components/AdminBottomTabs';

const PRIMARY = '#1A237E';
const BACKGROUND = '#F9F9FB';

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Información de cuenta', color: '#E8EAF6', iconColor: PRIMARY },
  { icon: 'shield-checkmark-outline', label: 'Seguridad', color: '#E8F5E9', iconColor: '#2E7D32' },
  { icon: 'notifications-outline', label: 'Notificaciones', color: '#FFF8E1', iconColor: '#F57F17' },
  { icon: 'help-circle-outline', label: 'Ayuda y soporte', color: '#F3E5F5', iconColor: '#6A1B9A' },
];

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.username?.[0] ?? 'A').toUpperCase()}
            </Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield" size={12} color="#fff" />
            <Text style={styles.adminBadgeText}>ADMINISTRADOR</Text>
          </View>
          <Text style={styles.profileName}>{user?.username}</Text>
          <Text style={styles.profileSub}>Banco CCB · Panel de Admin</Text>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>INFORMACIÓN DE SESIÓN</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Usuario</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={[styles.infoValue, { color: PRIMARY }]}>Administrador</Text>
          </View>
          <View style={[styles.infoRow, styles.lastRow]}>
            <Text style={styles.infoLabel}>Sistema</Text>
            <Text style={styles.infoValue}>Banco CCB</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.card}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as never} size={18} color={item.iconColor} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>

      <AdminBottomTabs active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },

  header: { paddingVertical: 12, marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1C1D' },

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
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  adminBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1.2 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  profileSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  lastRow: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, color: '#767683' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1C1D' },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1C1D' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 50,
    height: 52,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  logoutBtnText: { color: '#BA1A1A', fontSize: 15, fontWeight: '700' },
});

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export type AdminTab = 'panel' | 'users' | 'logs' | 'profile';

const TABS: { id: AdminTab; label: string; icon: string; activeIcon: string; route: string }[] = [
  { id: 'panel', label: 'Panel', icon: 'stats-chart-outline', activeIcon: 'stats-chart', route: '/admin' },
  { id: 'users', label: 'Usuarios', icon: 'people-outline', activeIcon: 'people', route: '/admin/users' },
  { id: 'logs', label: 'Registros', icon: 'list-outline', activeIcon: 'list', route: '/admin/logs' },
  { id: 'profile', label: 'Mi Perfil', icon: 'person-outline', activeIcon: 'person', route: '/admin/profile' },
];

const PRIMARY = '#1A237E';

export default function AdminBottomTabs({ active }: { active: AdminTab }) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => router.replace(tab.route as never)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(isActive ? tab.activeIcon : tab.icon) as never}
              size={22}
              color={isActive ? PRIMARY : '#9E9E9E'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 11, color: '#9E9E9E', fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '600' },
});

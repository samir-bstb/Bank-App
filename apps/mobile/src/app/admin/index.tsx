import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

type Card = { label: string; description: string; route: string; color: string };

const CARDS: Card[] = [
  {
    label: 'Users',
    description: 'View and manage all registered users',
    route: '/admin/users',
    color: '#0066FF',
  },
  {
    label: 'Logs',
    description: 'Browse all system activity logs',
    route: '/admin/logs',
    color: '#6C47FF',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>Logged in as {user?.username}</Text>

      {CARDS.map((card) => (
        <TouchableOpacity
          key={card.route}
          style={[styles.card, { borderLeftColor: card.color }]}
          onPress={() => router.push(card.route as any)}
          activeOpacity={0.75}
        >
          <Text style={[styles.cardTitle, { color: card.color }]}>{card.label}</Text>
          <Text style={styles.cardDescription}>{card.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

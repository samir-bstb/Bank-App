import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.replace('/home');
    }
  }, [user, loading]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0066FF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShown: true,
      }}
    />
  );
}

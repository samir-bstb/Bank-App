import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: unknown) {
  const value = JSON.stringify(user);

  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(USER_KEY, value);
}

export async function getUser() {
  let value: string | null = null;

  if (Platform.OS === 'web') {
    value = localStorage.getItem(USER_KEY);
  } else {
    value = await SecureStore.getItemAsync(USER_KEY);
  }

  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

export async function removeUser() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(USER_KEY);
}
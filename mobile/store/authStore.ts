import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserAuth } from '../types/index';

interface AuthState {
  user: UserAuth | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: UserAuth, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, accessToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, accessToken: null });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    set({ accessToken: token, isLoading: false });
  },
}));

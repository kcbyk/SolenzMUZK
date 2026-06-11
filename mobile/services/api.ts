import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your actual Render.com URL when deployed
// For local dev, use your machine's IP (e.g. http://192.168.1.x:3000)
const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
    return Promise.reject(error);
  },
);

export default api;

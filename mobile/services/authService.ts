import api from './api';
import type { UserAuth } from '../types/index';

export async function register(
  email: string,
  password: string,
): Promise<{ user: UserAuth; accessToken: string; refreshToken: string }> {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: UserAuth; accessToken: string; refreshToken: string }> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as userRepository from '../repositories/userRepository.js';
import { AppError } from '../utils/errors.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import type { AuthPayload } from '../types/index.js';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret';
const JWT_REFRESH_SECRET =
  process.env['JWT_REFRESH_SECRET'] ?? 'dev-refresh-secret';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_EXPIRES_MINUTES = 30;
const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateAccessToken(userId: string, email: string): string {
  const payload: AuthPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

export function generateRefreshToken(userId: string, email: string): string {
  const payload: AuthPayload = { userId, email };
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

export function verifyAccessToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  return decoded as AuthPayload;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ---------------------------------------------------------------------------
// Auth flows
// ---------------------------------------------------------------------------

export async function register(
  email: string,
  password: string,
): Promise<{
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
}> {
  if (!validateEmail(email)) {
    throw new AppError('INVALID_EMAIL', 'Invalid email address', 400);
  }
  if (!validatePassword(password)) {
    throw new AppError(
      'INVALID_PASSWORD',
      'Password must be at least 8 characters, contain an uppercase letter and a digit',
      400,
    );
  }

  const existing = await userRepository.findByEmail(email);
  if (existing !== null) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 'Email is already in use', 409);
  }

  const passwordHash = await hashPassword(password);
  const row = await userRepository.create(email, passwordHash);

  const accessToken = generateAccessToken(row.id, row.email);
  const refreshToken = generateRefreshToken(row.id, row.email);

  return {
    user: { id: row.id, email: row.email },
    accessToken,
    refreshToken,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<{
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
}> {
  const user = await userRepository.findByEmail(email);

  // User not found — throw generic error to prevent email enumeration
  if (user === null) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  // Account locked check
  if (user.locked_until !== null && user.locked_until > new Date()) {
    throw new AppError(
      'ACCOUNT_LOCKED',
      'Account is temporarily locked. Please try again later.',
      423,
    );
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  if (!passwordValid) {
    await userRepository.incrementLoginAttempts(user.id);

    // Re-fetch to get the updated attempt count
    const updated = await userRepository.findById(user.id);
    if (
      updated !== null &&
      updated.login_attempts >= MAX_LOGIN_ATTEMPTS
    ) {
      const lockUntil = new Date(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000,
      );
      await userRepository.lockAccount(user.id, lockUntil);
    }

    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  await userRepository.resetLoginAttempts(user.id);

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email);

  // Silently succeed if user not found — prevents email enumeration
  if (user === null) return;

  const token = generateResetToken();
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
  );

  await userRepository.setResetToken(user.id, token, expiresAt);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const user = await userRepository.findByResetToken(token);

  if (user === null) {
    throw new AppError('INVALID_RESET_TOKEN', 'Invalid or expired reset token', 400);
  }

  if (
    user.reset_token_expires_at === null ||
    user.reset_token_expires_at < new Date()
  ) {
    throw new AppError('RESET_TOKEN_EXPIRED', 'Reset token has expired', 400);
  }

  if (!validatePassword(newPassword)) {
    throw new AppError(
      'INVALID_PASSWORD',
      'Password must be at least 8 characters, contain an uppercase letter and a digit',
      400,
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(user.id, passwordHash);
  await userRepository.clearResetToken(user.id);
}

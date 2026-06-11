import pool from '../db/pool.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  login_attempts: number;
  locked_until: Date | null;
  reset_token: string | null;
  reset_token_expires_at: Date | null;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [email.trim().toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function findById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function create(
  email: string,
  passwordHash: string,
): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [email.trim().toLowerCase(), passwordHash],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create user');
  return row;
}

export async function incrementLoginAttempts(id: string): Promise<void> {
  await pool.query(
    'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1',
    [id],
  );
}

export async function lockAccount(id: string, until: Date): Promise<void> {
  await pool.query(
    'UPDATE users SET locked_until = $1, login_attempts = 0 WHERE id = $2',
    [until, id],
  );
}

export async function resetLoginAttempts(id: string): Promise<void> {
  await pool.query(
    'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1',
    [id],
  );
}

export async function setResetToken(
  id: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
    [token, expiresAt, id],
  );
}

export async function clearResetToken(id: string): Promise<void> {
  await pool.query(
    'UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = $1',
    [id],
  );
}

export async function findByResetToken(
  token: string,
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    'SELECT * FROM users WHERE reset_token = $1',
    [token],
  );
  return result.rows[0] ?? null;
}

export async function updatePassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, id],
  );
}

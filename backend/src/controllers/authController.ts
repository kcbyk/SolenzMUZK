import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.register(email, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      res.status(400).json({ error: { code: 'MISSING_REFRESH_TOKEN', message: 'refreshToken is required', retryable: false } });
      return;
    }
    const payload = authService.verifyRefreshToken(refreshToken);
    const accessToken = authService.generateAccessToken(payload.userId, payload.email);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Stateless JWT — just acknowledge
  res.status(200).json({ message: 'Logged out' });
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    await authService.requestPasswordReset(email);
    // Always return 200 to prevent email enumeration
    res.status(200).json({ message: 'If an account exists, a reset link will be sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService.js';
import { AppError } from '../utils/errors.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError('INVALID_TOKEN', 'Invalid or expired token', 401));
  }
}

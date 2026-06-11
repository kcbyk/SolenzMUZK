import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * GET /api/users/me
 * Returns the authenticated user's profile from the JWT payload.
 */
router.get(
  '/me',
  requireAuth,
  (req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({ user: req.user });
  },
);

/**
 * GET /api/users/me/storage
 * Returns the total download storage used by the authenticated user.
 * Placeholder — full implementation comes with the downloads feature.
 */
router.get(
  '/me/storage',
  requireAuth,
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({ totalBytes: 0, formatted: '0.00 MB' });
  },
);

export default router;

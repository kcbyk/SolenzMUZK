import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints.
 * 10 requests per 15-minute window per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    retryable: true,
  },
});

/**
 * General API rate limiter.
 * 100 requests per minute per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    retryable: true,
  },
});

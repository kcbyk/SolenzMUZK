import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRouter from './routes/auth.js';
import searchRouter from './routes/search.js';
import streamRouter from './routes/stream.js';
import downloadsRouter from './routes/downloads.js';
import playlistsRouter from './routes/playlists.js';
import usersRouter from './routes/users.js';
import channelsRouter from './routes/channels.js';
import trendingRouter from './routes/trending.js';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRateLimiter, authRouter);
app.use('/api/search', apiRateLimiter, searchRouter);
app.use('/api/stream', apiRateLimiter, streamRouter);
app.use('/api/downloads', apiRateLimiter, downloadsRouter);
app.use('/api/playlists', apiRateLimiter, playlistsRouter);
app.use('/api/users', apiRateLimiter, usersRouter);
app.use('/api/channels', apiRateLimiter, channelsRouter);
app.use('/api/trending', apiRateLimiter, trendingRouter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — must be registered last
app.use(errorHandler);

const PORT = process.env['PORT'] ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };

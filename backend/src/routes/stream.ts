import { Router } from 'express';
import * as streamController from '../controllers/streamController.js';

const router = Router();

// GET /api/stream/:videoId/audio-url
router.get('/:videoId/audio-url', streamController.getAudioUrl);

// GET /api/stream/:videoId/video-url?quality=720p
router.get('/:videoId/video-url', streamController.getVideoUrl);

export default router;

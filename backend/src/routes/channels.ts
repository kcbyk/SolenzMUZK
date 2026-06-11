import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';

const router = Router();

// GET /api/channels/:channelId/videos?page=1
router.get('/:channelId/videos', searchController.channelVideos);

export default router;

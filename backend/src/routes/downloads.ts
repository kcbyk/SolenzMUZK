import { Router } from 'express';
import * as downloadController from '../controllers/downloadController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', downloadController.startDownload);
router.get('/', downloadController.getDownloads);
router.get('/storage', downloadController.getStorageUsage);
router.get('/:id/progress', downloadController.getProgress);
router.delete('/:id', downloadController.deleteDownload);

export default router;

import { Router } from 'express';
import * as playlistController from '../controllers/playlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', playlistController.getPlaylists);
router.post('/', playlistController.createPlaylist);
router.put('/:id', playlistController.updatePlaylist);
router.delete('/:id', playlistController.deletePlaylist);
router.get('/:id/items', playlistController.getItems);
router.post('/:id/items', playlistController.addItem);
router.delete('/:id/items/:itemId', playlistController.removeItem);
router.put('/:id/items/reorder', playlistController.reorderItems);

export default router;

import { Router } from 'express';
import { trending } from '../controllers/searchController.js';

const router = Router();

// GET /api/trending?category=muzik&page=1
router.get('/', trending);

export default router;

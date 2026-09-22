import { Router } from 'express';
import { getTurnCredentials } from '../controllers/turnController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/credentials', authenticateToken, getTurnCredentials);

export default router;


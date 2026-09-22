import { Router } from 'express';
import { getChannelMessages, sendMessage } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/channels/:channelId/messages', getChannelMessages);
router.post('/channels/:channelId/messages', sendMessage);

export default router;


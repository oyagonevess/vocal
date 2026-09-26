import { Router } from 'express';
import { getAgoraRtcToken, getPresence } from '../controllers/agoraController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/rtc/agora/token/:channelId', authenticateToken, getAgoraRtcToken);
router.get('/rtc/presence', authenticateToken, getPresence);

export default router;


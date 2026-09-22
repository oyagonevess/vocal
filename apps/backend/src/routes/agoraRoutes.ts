import { Router } from 'express';
import { getAgoraRtcToken } from '../controllers/agoraController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/rtc/agora/token/:channelId', authenticateToken, getAgoraRtcToken);

export default router;


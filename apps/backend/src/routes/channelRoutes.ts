import { Router } from 'express';
import { createChannel, deleteChannel } from '../controllers/channelController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/servers/:serverId/channels', requireRole(['OWNER', 'ADMIN']), createChannel);
router.delete('/channels/:channelId', deleteChannel);

export default router;


import { Router } from 'express';
import {
  createServer,
  getUserServers,
  getServerById,
  updateServer,
  deleteServer,
  createInviteToken,
  joinServerByInvite,
  updateMemberRole,
  kickMember,
} from '../controllers/serverController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createServer);
router.get('/', getUserServers);
router.get('/:serverId', getServerById);
router.put('/:serverId', requireRole(['OWNER', 'ADMIN']), updateServer);
router.delete('/:serverId', requireRole(['OWNER']), deleteServer);
router.post('/:serverId/invites', requireRole(['OWNER', 'ADMIN']), createInviteToken);
router.post('/join/:code', joinServerByInvite);
router.put('/:serverId/members/:targetUserId/role', requireRole(['OWNER']), updateMemberRole);
router.delete('/:serverId/members/:targetUserId', requireRole(['OWNER', 'ADMIN']), kickMember);

export default router;

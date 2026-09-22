import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateEphemeralTurnCredentials } from '../services/turnService.js';

export async function getTurnCredentials(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });

  const credentials = generateEphemeralTurnCredentials(req.user.username);
  return res.json({ iceServers: credentials });
}


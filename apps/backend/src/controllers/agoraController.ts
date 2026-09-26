import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateAgoraRtcToken } from '../services/agoraService.js';

import { sfuServer } from '../rtc/sfuServer.js';

export async function getAgoraRtcToken(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });

  const { channelId } = req.params;
  if (!channelId) {
    return res.status(400).json({ error: 'ID do canal é obrigatório.' });
  }

  try {
    const agoraData = generateAgoraRtcToken(channelId, req.user.userId);
    return res.json(agoraData);
  } catch (err) {
    console.error('Erro ao gerar token do Agora:', err);
    return res.status(500).json({ error: 'Erro ao gerar token de acesso do Agora.io.' });
  }
}

export async function getPresence(req: AuthenticatedRequest, res: Response) {
  try {
    const presence = sfuServer.getPresenceMap();
    return res.json({ presence });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter presença dos canais.' });
  }
}


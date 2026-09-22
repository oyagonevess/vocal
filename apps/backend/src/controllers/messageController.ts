import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sfuServer } from '../rtc/sfuServer.js';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function getChannelMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const messages = await prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar mensagens do canal.' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    const { channelId } = req.params;

    const parseResult = sendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Conteúdo da mensagem inválido.' });
    }

    const { content } = parseResult.data;

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        userId: req.user.userId,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    // Broadcast message over WebSocket in real time
    sfuServer.broadcastMessage(channelId, message);

    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
}


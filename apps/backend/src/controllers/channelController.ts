import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createChannelSchema = z.object({
  name: z.string().min(2).max(40),
  type: z.enum(['TEXT', 'VOICE']).default('VOICE'),
  userLimit: z.number().int().min(0).max(99).default(0),
});

export async function createChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId } = req.params;
    const parseResult = createChannelSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Dados do canal inválidos.' });
    }

    const { name, type, userLimit } = parseResult.data;

    const channel = await prisma.channel.create({
      data: {
        serverId,
        name,
        type,
        userLimit,
      },
    });

    return res.status(201).json({ channel });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar canal.' });
  }
}

export async function deleteChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;

    await prisma.channel.delete({
      where: { id: channelId },
    });

    return res.json({ message: 'Canal deletado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao deletar canal.' });
  }
}

import { Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createServerSchema = z.object({
  name: z.string().min(2).max(50),
  iconUrl: z.string().optional().nullable(),
});

const updateServerSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  iconUrl: z.string().optional().nullable(),
});

export async function createServer(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });

    const parseResult = createServerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Dados inválidos do servidor.' });
    }

    const { name, iconUrl } = parseResult.data;

    const server = await prisma.server.create({
      data: {
        name,
        iconUrl,
        ownerId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: 'OWNER',
          },
        },
        channels: {
          create: [
            { name: 'chat-geral', type: 'TEXT' },
            { name: 'regras-e-avisos', type: 'TEXT' },
            { name: 'Sala Geral (Voz)', type: 'VOICE', userLimit: 0 },
            { name: 'Transmissão Ao Vivo', type: 'VOICE', userLimit: 10 },
          ],
        },
      },
      include: {
        channels: true,
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.status(201).json({ server });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar servidor.' });
  }
}

export async function getUserServers(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });

    const servers = await prisma.server.findMany({
      where: {
        members: {
          some: { userId: req.user.userId },
        },
      },
      include: {
        channels: true,
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.json({ servers });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar servidores.' });
  }
}

export async function getServerById(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId } = req.params;
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        channels: true,
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!server) return res.status(404).json({ error: 'Servidor não encontrado.' });
    return res.json({ server });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao obter servidor.' });
  }
}

export async function updateServer(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId } = req.params;
    const parseResult = updateServerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }

    const { name, iconUrl } = parseResult.data;

    const server = await prisma.server.update({
      where: { id: serverId },
      data: {
        ...(name && { name }),
        ...(iconUrl && { iconUrl }),
      },
      include: {
        channels: true,
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.json({ server });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar servidor.' });
  }
}

export async function deleteServer(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId } = req.params;

    await prisma.server.delete({
      where: { id: serverId },
    });

    return res.json({ message: 'Servidor excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir servidor.' });
  }
}

export async function createInviteToken(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId } = req.params;
    const code = crypto.randomBytes(4).toString('hex');

    const invite = await prisma.inviteToken.create({
      data: {
        code,
        serverId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({ invite });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao gerar link de convite.' });
  }
}

export async function joinServerByInvite(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    const { code } = req.params;

    const invite = await prisma.inviteToken.findUnique({ where: { code } });
    if (!invite) return res.status(404).json({ error: 'Convite inválido ou expirado.' });

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Convite expirado.' });
    }

    const existingMember = await prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId: req.user.userId,
          serverId: invite.serverId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Você já é membro deste servidor.' });
    }

    await prisma.member.create({
      data: {
        userId: req.user.userId,
        serverId: invite.serverId,
        role: 'MEMBER',
      },
    });

    await prisma.inviteToken.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } },
    });

    const server = await prisma.server.findUnique({
      where: { id: invite.serverId },
      include: {
        channels: true,
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.json({ message: 'Conectado ao servidor com sucesso!', server });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao se juntar ao servidor.' });
  }
}

export async function updateMemberRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId, targetUserId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Cargo inválido.' });
    }

    const member = await prisma.member.update({
      where: {
        userId_serverId: {
          userId: targetUserId,
          serverId,
        },
      },
      data: { role },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return res.json({ member });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar cargo do membro.' });
  }
}

export async function kickMember(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverId, targetUserId } = req.params;

    await prisma.member.delete({
      where: {
        userId_serverId: {
          userId: targetUserId,
          serverId,
        },
      },
    });

    return res.json({ message: 'Membro removido com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover membro.' });
  }
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../services/db.js';

export interface AuthPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token de acesso inválido ou expirado.' });
  }
}

export function requireRole(allowedRoles: ('OWNER' | 'ADMIN' | 'MEMBER')[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const serverId = req.params.serverId || req.body.serverId;
    if (!serverId) {
      return res.status(400).json({ error: 'ID do servidor é obrigatório para verificar permissões.' });
    }

    try {
      const member = await prisma.member.findUnique({
        where: {
          userId_serverId: {
            userId: req.user.userId,
            serverId,
          },
        },
      });

      if (!member || !allowedRoles.includes(member.role as any)) {
        return res.status(403).json({ error: 'Permissão insuficiente para esta ação.' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao verificar permissão RBAC.' });
    }
  };
}


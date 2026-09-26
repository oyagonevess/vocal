import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  avatarUrl: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  avatarUrl: z.string().optional().nullable(),
});

export async function register(req: Request, res: Response) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Dados inválidos.', details: parseResult.error.format() });
    }

    const { username, email, password, avatarUrl } = parseResult.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'E-mail ou nome de usuário já está em uso.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: 'Usuário registrado com sucesso.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[ERRO REGISTO]:', err);
    return res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Dados de login inválidos.' });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('[ERRO LOGIN]:', err);
    return res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const refreshTokenCookie = req.cookies?.refreshToken;
  if (!refreshTokenCookie) {
    return res.status(401).json({ error: 'Refresh token ausente.' });
  }

  try {
    const payload = jwt.verify(refreshTokenCookie, config.jwtRefreshSecret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Refresh token inválido ou expirado.' });
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict',
  });
  return res.json({ message: 'Logout realizado com sucesso.' });
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
  });
  return res.json({ user });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Dados inválidos do perfil.' });
    }

    const { username, avatarUrl } = parseResult.data;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(username && { username }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
    });

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
}

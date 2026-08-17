import crypto from 'node:crypto';
import argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_EXPIRES_IN_MS,
  REFRESH_COOKIE_NAME,
} from '../lib/tokens.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  signed: true,
  maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
  path: '/api/auth',
};

async function issueSession(res, user, familyId) {
  const refreshToken = generateRefreshToken();

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      familyId: familyId ?? crypto.randomUUID(),
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
    },
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  return session;
}

export async function register(req, res) {
  const { email, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  await issueSession(res, user);
  const accessToken = signAccessToken(user);

  res.status(201).json({ accessToken, user: { id: user.id, email: user.email } });
}



export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await argon2.verify(user.passwordHash, password) : false;

  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await issueSession(res, user);
  const accessToken = signAccessToken(user);

  res.json({ accessToken, user: { id: user.id, email: user.email } });
}

export async function refresh(req, res) {
  const token = req.signedCookies[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  const tokenHash = hashRefreshToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash } });

  if (!session || session.expiresAt < new Date()) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  if (session.revokedAt) {
    await prisma.session.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return res.status(401).json({ error: 'Refresh token reuse detected' });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  await issueSession(res, user, session.familyId);
  const accessToken = signAccessToken(user);

  res.json({ accessToken });
}

export async function logout(req, res) {
  const token = req.signedCookies[REFRESH_COOKIE_NAME];
  if (token) {
    const tokenHash = hashRefreshToken(token);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).end();
}

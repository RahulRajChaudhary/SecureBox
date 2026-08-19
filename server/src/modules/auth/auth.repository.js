import { prisma } from '../../lib/prisma.js';

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(email, passwordHash) {
  return prisma.user.create({ data: { email, passwordHash } });
}

export async function findUserByGoogleId(googleId) {
  return prisma.user.findUnique({ where: { googleId } });
}

export async function createUserWithGoogle(email, googleId) {
  return prisma.user.create({ data: { email, googleId, passwordHash: null } });
}

export async function linkGoogleId(userId, googleId) {
  return prisma.user.update({ where: { id: userId }, data: { googleId } });
}

export async function createSession({ userId, familyId, tokenHash, expiresAt }) {
  return prisma.session.create({ data: { userId, familyId, tokenHash, expiresAt } });
}

export async function findSessionByTokenHash(tokenHash) {
  return prisma.session.findUnique({ where: { tokenHash } });
}

export async function revokeSession(id) {
  return prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
}

export async function revokeSessionFamily(familyId) {
  return prisma.session.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeSessionByTokenHash(tokenHash) {
  return prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId) {
  return prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

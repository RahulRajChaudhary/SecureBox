import { prisma } from '../../lib/prisma.js';

// Every method that touches a specific file scopes to ownerId in the
// WHERE clause. Never fetch first and check ownership in the caller —
// that pattern is one missed check away from a data breach.

export async function createFile(data) {
  return prisma.file.create({ data });
}

export async function findOwnedFile(fileId, ownerId) {
  return prisma.file.findFirst({
    where: { id: fileId, ownerId, deletedAt: null },
  });
}

export async function findFileBySlug(shareSlug) {
  return prisma.file.findFirst({
    where: { shareSlug, status: 'READY', deletedAt: null },
  });
}

export async function listOwnedFiles(ownerId, { cursor, limit = 20, q, sort = 'createdAt_desc', folderId } = {}) {
  const [sortField, sortDir] = sort.startsWith('name_') ? ['originalName', sort.slice(5)] : ['createdAt', sort.slice(10)];
  const orderBy = sortField === 'originalName'
    ? [{ originalName: sortDir }, { id: sortDir }]
    : [{ createdAt: sortDir }, { id: sortDir }];

  const where = {
    ownerId,
    deletedAt: null,
    status: 'READY',
    // A search query spans the whole drive, like Google Drive's search —
    // otherwise (no q) the listing is scoped to the current folder (null = root).
    ...(q ? { originalName: { contains: q, mode: 'insensitive' } } : { folderId: folderId ?? null }),
  };

  if (cursor) {
    const [cursorValue, cursorId] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    const op = sortDir === 'desc' ? 'lt' : 'gt';
    where.OR = [
      { [sortField]: { [op]: sortField === 'createdAt' ? new Date(cursorValue) : cursorValue } },
      { [sortField]: sortField === 'createdAt' ? new Date(cursorValue) : cursorValue, id: { [op]: cursorId } },
    ];
  }

  const rows = await prisma.file.findMany({ where, orderBy, take: limit + 1 });
  const hasMore = rows.length > limit;
  const files = hasMore ? rows.slice(0, limit) : rows;
  const last = files.at(-1);
  const nextCursor = hasMore
    ? Buffer.from(`${sortField === 'createdAt' ? last.createdAt.toISOString() : last.originalName}|${last.id}`).toString('base64url')
    : null;

  return { files, nextCursor };
}

export async function updateFile(fileId, ownerId, data) {
  const { count } = await prisma.file.updateMany({
    where: { id: fileId, ownerId, deletedAt: null },
    data,
  });
  if (count === 0) return null;
  return findOwnedFile(fileId, ownerId);
}

export async function softDeleteFile(fileId, ownerId) {
  return prisma.file.updateMany({
    where: { id: fileId, ownerId, deletedAt: null },
    data: { deletedAt: new Date(), status: 'DELETING' },
  });
}

export async function findTrashedFile(fileId, ownerId) {
  return prisma.file.findFirst({
    where: { id: fileId, ownerId, status: 'DELETING', deletedAt: { not: null } },
  });
}

export async function listTrashedFiles(ownerId) {
  return prisma.file.findMany({
    where: { ownerId, status: 'DELETING', deletedAt: { not: null } },
    orderBy: [{ deletedAt: 'desc' }],
  });
}

export async function restoreFile(fileId, ownerId) {
  const { count } = await prisma.file.updateMany({
    where: { id: fileId, ownerId, status: 'DELETING', deletedAt: { not: null } },
    data: { deletedAt: null, status: 'READY' },
  });
  if (count === 0) return null;
  return findOwnedFile(fileId, ownerId);
}

export async function findStalePendingFiles(olderThanDays) {
  return prisma.file.findMany({
    where: {
      status: { in: ['PENDING', 'UPLOADING'] },
      createdAt: { lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    },
  });
}

export async function findDeletingFiles(olderThanDays) {
  return prisma.file.findMany({
    where: {
      status: 'DELETING',
      deletedAt: { not: null, lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000) },
    },
  });
}

export async function getUsageBytes(ownerId) {
  const result = await prisma.file.aggregate({
    where: { ownerId, status: 'READY', deletedAt: null },
    _sum: { sizeBytes: true },
  });
  return result._sum.sizeBytes ?? 0n;
}

import { prisma } from '../../lib/prisma.js';

// Same rule as files.repository.js — every method that touches a specific
// folder scopes to ownerId in the WHERE clause. Never fetch-then-check.

export async function createFolder(data) {
  return prisma.folder.create({ data });
}

export async function findOwnedFolder(folderId, ownerId) {
  return prisma.folder.findFirst({ where: { id: folderId, ownerId } });
}

export async function findFolderBySlug(shareSlug) {
  return prisma.folder.findFirst({ where: { shareSlug } });
}

export async function listOwnedFolders(ownerId, parentId = null, q) {
  return prisma.folder.findMany({
    where: {
      ownerId,
      // Search spans the whole drive, like listOwnedFiles does for q —
      // otherwise the listing is scoped to parentId (null = root).
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : { parentId }),
    },
    orderBy: [{ name: 'asc' }],
  });
}

// Whole-drive, like listOwnedFiles' recent/shared/favorites views — not
// scoped to a parent folder.
export async function listFavoriteFolders(ownerId) {
  return prisma.folder.findMany({
    where: { ownerId, isFavorite: true },
    orderBy: [{ name: 'asc' }],
  });
}

export async function updateFolder(folderId, ownerId, data) {
  const { count } = await prisma.folder.updateMany({
    where: { id: folderId, ownerId },
    data,
  });
  if (count === 0) return null;
  return findOwnedFolder(folderId, ownerId);
}

export async function deleteFolder(folderId, ownerId) {
  return prisma.folder.deleteMany({ where: { id: folderId, ownerId } });
}

export async function countChildren(folderId, ownerId) {
  const [subfolders, files] = await Promise.all([
    prisma.folder.count({ where: { parentId: folderId, ownerId } }),
    prisma.file.count({ where: { folderId, ownerId, deletedAt: null } }),
  ]);
  return subfolders + files;
}

// Like countChildren, but split instead of summed, and file count is
// scoped to READY only (the sidebar tree shouldn't count in-flight
// uploads, unlike the delete-safety check in countChildren).
export async function countDirectChildrenBreakdown(folderId, ownerId) {
  const [subfolders, files] = await Promise.all([
    prisma.folder.count({ where: { parentId: folderId, ownerId } }),
    prisma.file.count({ where: { folderId, ownerId, status: 'READY', deletedAt: null } }),
  ]);
  return { subfolders, files };
}

// Walks the parent chain to build a root-first breadcrumb. Folder trees are
// shallow in practice, so N sequential lookups beats a recursive CTE here.
export async function getAncestors(folderId, ownerId) {
  const chain = [];
  let current = await findOwnedFolder(folderId, ownerId);
  while (current) {
    chain.unshift({ id: current.id, name: current.name });
    if (!current.parentId) break;
    current = await findOwnedFolder(current.parentId, ownerId);
  }
  return chain;
}

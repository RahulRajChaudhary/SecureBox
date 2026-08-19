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

export async function listOwnedFolders(ownerId, parentId = null) {
  return prisma.folder.findMany({
    where: { ownerId, parentId },
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

import * as foldersRepo from './folders.repository.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';
import { nanoid } from 'nanoid';

export async function createFolder({ userId, name, parentId }) {
  if (parentId) {
    const parent = await foldersRepo.findOwnedFolder(parentId, userId);
    if (!parent) throw new NotFoundError('Parent folder not found');
  }
  return foldersRepo.createFolder({ ownerId: userId, name, parentId: parentId ?? null });
}

export async function listFolders({ userId, parentId }) {
  if (parentId) {
    const parent = await foldersRepo.findOwnedFolder(parentId, userId);
    if (!parent) throw new NotFoundError('Folder not found');
  }
  const folders = await foldersRepo.listOwnedFolders(userId, parentId ?? null);
  const counts = await Promise.all(
    folders.map((folder) => foldersRepo.countDirectChildrenBreakdown(folder.id, userId)),
  );
  return folders.map((folder, i) => ({
    ...folder,
    subfolderCount: counts[i].subfolders,
    fileCount: counts[i].files,
  }));
}

export async function getFolder({ userId, folderId }) {
  const folder = await foldersRepo.findOwnedFolder(folderId, userId);
  if (!folder) throw new NotFoundError();
  const breadcrumb = await foldersRepo.getAncestors(folderId, userId);
  return { folder, breadcrumb };
}

async function renameFolder({ userId, folderId, name }) {
  const folder = await foldersRepo.updateFolder(folderId, userId, { name });
  if (!folder) throw new NotFoundError();
  return folder;
}

async function moveFolder({ userId, folderId, parentId }) {
  if (parentId && folderId === parentId) throw new ConflictError('Cannot move a folder into itself');

  if (parentId) {
    const target = await foldersRepo.findOwnedFolder(parentId, userId);
    if (!target) throw new NotFoundError('Destination folder not found');

    const ancestors = await foldersRepo.getAncestors(parentId, userId);
    if (ancestors.some((a) => a.id === folderId)) {
      throw new ConflictError('Cannot move a folder into its own subfolder');
    }
  }

  const folder = await foldersRepo.updateFolder(folderId, userId, { parentId: parentId ?? null });
  if (!folder) throw new NotFoundError();
  return folder;
}

export async function updateFolderVisibility({ userId, folderId, visibility }) {
  const folder = await foldersRepo.findOwnedFolder(folderId, userId);
  if (!folder) throw new NotFoundError();

  let shareSlug = folder.shareSlug;
  if (visibility === 'PUBLIC' && !shareSlug) {
    shareSlug = nanoid(16);
  }
  if (visibility === 'PRIVATE' && shareSlug) {
    shareSlug = null; // rotate — old link dies immediately, not lazily
  }

  return foldersRepo.updateFolder(folderId, userId, { visibility, shareSlug });
}

export async function updateFolder({ userId, folderId, name, parentId, visibility, isFavorite }) {
  if (visibility !== undefined) await updateFolderVisibility({ userId, folderId, visibility });
  if (parentId !== undefined) await moveFolder({ userId, folderId, parentId });
  if (isFavorite !== undefined) {
    const folder = await foldersRepo.updateFolder(folderId, userId, { isFavorite });
    if (!folder) throw new NotFoundError();
  }
  if (name !== undefined) return renameFolder({ userId, folderId, name });
  return foldersRepo.findOwnedFolder(folderId, userId);
}

export async function listFavoriteFolders({ userId }) {
  return foldersRepo.listFavoriteFolders(userId);
}

export async function deleteFolder({ userId, folderId }) {
  const folder = await foldersRepo.findOwnedFolder(folderId, userId);
  if (!folder) throw new NotFoundError();

  const childCount = await foldersRepo.countChildren(folderId, userId);
  if (childCount > 0) throw new ConflictError('Folder is not empty', 'FOLDER_NOT_EMPTY');

  await foldersRepo.deleteFolder(folderId, userId);
}

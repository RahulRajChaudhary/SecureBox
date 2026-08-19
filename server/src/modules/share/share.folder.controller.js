import * as foldersRepo from '../folders/folders.repository.js';
import { prisma } from '../../lib/prisma.js';
import { getPresignedDownloadUrl } from '../../services/upload.service.js';
import { NotFoundError } from '../../lib/errors.js';

async function loadPublicRoot(slug) {
  const folder = await foldersRepo.findFolderBySlug(slug);
  if (!folder || folder.visibility !== 'PUBLIC') {
    // Same 404 for both cases — don't confirm a private folder exists
    throw new NotFoundError();
  }
  return folder;
}

async function loadChildren(folderId, ownerId) {
  const [subfolders, files] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId, ownerId }, orderBy: [{ name: 'asc' }] }),
    prisma.file.findMany({
      where: { folderId, ownerId, status: 'READY', deletedAt: null },
      orderBy: [{ originalName: 'asc' }],
    }),
  ]);
  return {
    subfolders: subfolders.map((f) => ({ id: f.id, name: f.name })),
    files: files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes.toString(),
    })),
  };
}

export async function getRoot(req, res) {
  const root = await loadPublicRoot(req.params.slug);
  const { subfolders, files } = await loadChildren(root.id, root.ownerId);
  res.json({
    data: { id: root.id, name: root.name, breadcrumb: [{ id: root.id, name: root.name }], subfolders, files },
  });
}

export async function browse(req, res) {
  const root = await loadPublicRoot(req.params.slug);

  // getAncestors is owner-scoped, so a folderId belonging to a different
  // owner (or that doesn't exist) resolves to []. rootIndex === -1 covers
  // both that case and "exists but isn't under this shared root".
  const ancestors = await foldersRepo.getAncestors(req.params.folderId, root.ownerId);
  const rootIndex = ancestors.findIndex((a) => a.id === root.id);
  if (rootIndex === -1) throw new NotFoundError();

  const breadcrumb = ancestors.slice(rootIndex);
  const target = breadcrumb.at(-1);
  const { subfolders, files } = await loadChildren(target.id, root.ownerId);
  res.json({ data: { id: target.id, name: target.name, breadcrumb, subfolders, files } });
}

export async function downloadFile(req, res) {
  const root = await loadPublicRoot(req.params.slug);

  const file = await prisma.file.findFirst({
    where: { id: req.params.fileId, ownerId: root.ownerId, status: 'READY', deletedAt: null },
  });
  if (!file || !file.folderId) throw new NotFoundError();

  const ancestors = await foldersRepo.getAncestors(file.folderId, root.ownerId);
  if (!ancestors.some((a) => a.id === root.id)) throw new NotFoundError();

  const url = await getPresignedDownloadUrl({ storageKey: file.storageKey, filename: file.originalName });
  res.redirect(302, url);
}

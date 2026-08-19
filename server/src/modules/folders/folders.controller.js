import * as foldersService from './folders.service.js';
import { createFolderSchema, listFoldersSchema, updateFolderSchema } from './folders.schemas.js';

function serializeFolder(folder) {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    visibility: folder.visibility,
    shareSlug: folder.shareSlug,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    ...(folder.subfolderCount !== undefined && {
      subfolderCount: folder.subfolderCount,
      fileCount: folder.fileCount,
    }),
  };
}

export async function create(req, res) {
  const body = createFolderSchema.parse(req.body);
  const folder = await foldersService.createFolder({ userId: req.userId, ...body });
  res.status(201).json({ data: serializeFolder(folder) });
}

export async function list(req, res) {
  const query = listFoldersSchema.parse(req.query);
  const folders = await foldersService.listFolders({ userId: req.userId, parentId: query.parentId });
  res.json({ data: folders.map(serializeFolder) });
}

export async function get(req, res) {
  const { folder, breadcrumb } = await foldersService.getFolder({ userId: req.userId, folderId: req.params.id });
  res.json({ data: { ...serializeFolder(folder), breadcrumb } });
}

export async function update(req, res) {
  const body = updateFolderSchema.parse(req.body);
  const folder = await foldersService.updateFolder({ userId: req.userId, folderId: req.params.id, ...body });
  res.json({ data: serializeFolder(folder) });
}

export async function remove(req, res) {
  await foldersService.deleteFolder({ userId: req.userId, folderId: req.params.id });
  res.status(204).end();
}

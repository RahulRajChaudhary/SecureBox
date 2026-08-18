import * as filesService from './files.service.js';
import { intentSchema, resumeSchema, updateSchema, listSchema } from './files.schemas.js';

// storageKey/uploadId are internal — never put them in a response body.
function serializeFile(file) {
  return {
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes.toString(),
    status: file.status,
    visibility: file.visibility,
    shareSlug: file.shareSlug,
    createdAt: file.createdAt,
  };
}

function serializeTrashedFile(file) {
  return { ...serializeFile(file), deletedAt: file.deletedAt };
}

export async function createIntent(req, res) {
  const body = intentSchema.parse(req.body);
  const { file, partUrls } = await filesService.createUploadIntent({ userId: req.userId, ...body });
  res.status(201).json({
    data: { fileId: file.id, partSize: file.partSizeBytes, totalParts: file.totalParts, partUrls },
  });
}

export async function uploadStatus(req, res) {
  const status = await filesService.getUploadStatus({ fileId: req.params.id, userId: req.userId });
  res.json({ data: status });
}

export async function resume(req, res) {
  const { missingParts } = resumeSchema.parse(req.body);
  const result = await filesService.resumeUpload({ fileId: req.params.id, userId: req.userId, missingParts });
  res.json({ data: result });
}

export async function complete(req, res) {
  const file = await filesService.completeUpload({ fileId: req.params.id, userId: req.userId });
  res.json({ data: serializeFile(file) });
}

export async function abort(req, res) {
  await filesService.abortUpload({ fileId: req.params.id, userId: req.userId });
  res.status(204).end();
}

export async function list(req, res) {
  const query = listSchema.parse(req.query);
  const { files, nextCursor } = await filesService.listFiles({ userId: req.userId, ...query });
  res.json({ data: files.map(serializeFile), nextCursor });
}

export async function update(req, res) {
  const body = updateSchema.parse(req.body);
  const file = await filesService.updateFile({ fileId: req.params.id, userId: req.userId, ...body });
  res.json({ data: serializeFile(file) });
}

export async function remove(req, res) {
  await filesService.deleteFile({ fileId: req.params.id, userId: req.userId });
  res.status(204).end();
}

export async function trash(req, res) {
  const files = await filesService.listTrash({ userId: req.userId });
  res.json({ data: files.map(serializeTrashedFile) });
}

export async function restore(req, res) {
  const file = await filesService.restoreFile({ fileId: req.params.id, userId: req.userId });
  res.json({ data: serializeFile(file) });
}

export async function download(req, res) {
  const { url } = await filesService.getDownloadUrl({ fileId: req.params.id, userId: req.userId });
  res.redirect(302, url);
}

export async function previewUrl(req, res) {
  const { url } = await filesService.getPreviewUrl({ fileId: req.params.id, userId: req.userId });
  res.json({ data: { url } });
}

export async function zipContents(req, res) {
  const listing = await filesService.getZipContents({ fileId: req.params.id, userId: req.userId });
  res.json({ data: listing });
}

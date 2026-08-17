import * as filesRepo from '../files/files.repository.js';
import { getPresignedDownloadUrl } from '../../services/upload.service.js';
import { NotFoundError } from '../../lib/errors.js';

export async function getMeta(req, res) {
  const file = await filesRepo.findFileBySlug(req.params.slug);
  if (!file || file.visibility !== 'PUBLIC') {
    // Same 404 for both cases — don't confirm a private file exists
    throw new NotFoundError();
  }
  res.json({
    data: {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes.toString(),
      createdAt: file.createdAt,
    },
  });
}

export async function download(req, res) {
  const file = await filesRepo.findFileBySlug(req.params.slug);
  if (!file || file.visibility !== 'PUBLIC' || file.status !== 'READY') {
    throw new NotFoundError();
  }
  const url = await getPresignedDownloadUrl({ storageKey: file.storageKey, filename: file.originalName });
  res.redirect(302, url);
}

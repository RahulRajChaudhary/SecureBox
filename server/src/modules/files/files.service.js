import crypto from 'node:crypto';
import path from 'node:path';
import { nanoid } from 'nanoid';
import * as filesRepo from './files.repository.js';
import * as foldersRepo from '../folders/folders.repository.js';
import { validateFileIntent, computePartSize, sniffMimeType } from '../../services/storage.service.js';
import { getZipListing } from '../../services/zip.service.js';
import { STORAGE_LIMIT_BYTES } from '../../config/upload.constants.js';
import {
  createMultipartUpload,
  signPartUrls,
  signSpecificPartUrls,
  listParts,
  completeMultipartUpload,
  abortMultipartUpload,
  headObject,
  getPresignedDownloadUrl,
} from '../../services/upload.service.js';
import { NotFoundError, ConflictError, QuotaExceededError } from '../../lib/errors.js';

export async function createUploadIntent({ userId, filename, sizeBytes, mimeType, folderId }) {
  if (folderId) {
    const folder = await foldersRepo.findOwnedFolder(folderId, userId);
    if (!folder) throw new NotFoundError('Folder not found');
  }

  const { sanitizedName, mimeType: resolvedMimeType } = validateFileIntent({ filename, sizeBytes, mimeType });

  const usedBytes = await filesRepo.getUsageBytes(userId);
  if (usedBytes + BigInt(sizeBytes) > BigInt(STORAGE_LIMIT_BYTES)) {
    throw new QuotaExceededError();
  }

  const partSize = computePartSize(sizeBytes);
  const totalParts = Math.ceil(Number(sizeBytes) / partSize);
  const storageKey = `users/${userId}/${crypto.randomUUID()}`;

  const { UploadId } = await createMultipartUpload({ storageKey, mimeType: resolvedMimeType });

  const file = await filesRepo.createFile({
    ownerId: userId,
    storageKey,
    originalName: sanitizedName,
    mimeType: resolvedMimeType,
    sizeBytes: BigInt(sizeBytes),
    uploadId: UploadId,
    partSizeBytes: partSize,
    totalParts,
    folderId: folderId ?? null,
    status: 'PENDING',
  });

  const partUrls = await signPartUrls({ storageKey, uploadId: UploadId, totalParts });
  return { file, partUrls };
}

export async function getUploadStatus({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  if (!file.uploadId) throw new ConflictError('No active upload session', 'NO_UPLOAD_SESSION');

  const parts = await listParts({ storageKey: file.storageKey, uploadId: file.uploadId });
  return {
    fileId: file.id,
    partSize: file.partSizeBytes,
    totalParts: file.totalParts,
    uploadedParts: parts.map((p) => p.PartNumber),
  };
}

export async function resumeUpload({ fileId, userId, missingParts }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  if (file.status === 'READY') throw new ConflictError('Upload already complete');

  const partUrls = await signSpecificPartUrls({
    storageKey: file.storageKey,
    uploadId: file.uploadId,
    partNumbers: missingParts,
  });
  return { partUrls };
}

export async function completeUpload({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();

  // Idempotent — calling complete twice is success, not an error
  if (file.status === 'READY') return file;

  // Server-side part list — never trust what the client claims it uploaded
  const parts = await listParts({ storageKey: file.storageKey, uploadId: file.uploadId });

  if (parts.length !== file.totalParts) {
    throw new ConflictError(`Expected ${file.totalParts} parts, found ${parts.length}`, 'INCOMPLETE_UPLOAD');
  }

  await completeMultipartUpload({
    storageKey: file.storageKey,
    uploadId: file.uploadId,
    parts: parts.map((p) => ({ PartNumber: p.PartNumber, ETag: p.ETag })),
  });

  const head = await headObject({ storageKey: file.storageKey });
  if (BigInt(head.ContentLength) !== file.sizeBytes) {
    await abortAndFail(file);
    throw new ConflictError('File size mismatch after upload', 'SIZE_MISMATCH');
  }

  const verifiedMime = await sniffMimeType(file.storageKey);

  await filesRepo.updateFile(file.id, userId, {
    status: 'READY',
    mimeType: verifiedMime,
    checksum: head.ETag,
    uploadId: null,
  });

  return filesRepo.findOwnedFile(fileId, userId);
}

async function abortAndFail(file) {
  await abortMultipartUpload({ storageKey: file.storageKey, uploadId: file.uploadId });
  await filesRepo.updateFile(file.id, file.ownerId, { status: 'FAILED', uploadId: null });
}

export async function abortUpload({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  if (file.uploadId) {
    await abortMultipartUpload({ storageKey: file.storageKey, uploadId: file.uploadId });
  }
  await filesRepo.updateFile(file.id, userId, { status: 'FAILED' });
}

export async function getDownloadUrl({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  if (file.status !== 'READY') throw new ConflictError('File not ready', 'FILE_NOT_READY');

  const url = await getPresignedDownloadUrl({ storageKey: file.storageKey, filename: file.originalName });
  return { url };
}

export async function updateFileVisibility({ fileId, userId, visibility }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();

  let shareSlug = file.shareSlug;
  if (visibility === 'PUBLIC' && !shareSlug) {
    shareSlug = nanoid(16);
  }
  if (visibility === 'PRIVATE' && shareSlug) {
    shareSlug = null; // rotate — old link dies immediately, not lazily
  }

  return filesRepo.updateFile(fileId, userId, { visibility, shareSlug });
}

export async function renameFile({ fileId, userId, name }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  const sanitized = path.basename(name).replace(/\0/g, '').slice(0, 255);
  return filesRepo.updateFile(fileId, userId, { originalName: sanitized });
}

export async function moveFile({ fileId, userId, folderId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();

  if (folderId) {
    const folder = await foldersRepo.findOwnedFolder(folderId, userId);
    if (!folder) throw new NotFoundError('Destination folder not found');
  }

  return filesRepo.updateFile(fileId, userId, { folderId: folderId ?? null });
}

export async function updateFile({ fileId, userId, name, visibility, folderId, isFavorite }) {
  if (visibility) await updateFileVisibility({ fileId, userId, visibility });
  if (folderId !== undefined) await moveFile({ fileId, userId, folderId });
  if (isFavorite !== undefined) {
    const file = await filesRepo.updateFile(fileId, userId, { isFavorite });
    if (!file) throw new NotFoundError();
  }
  if (name) return renameFile({ fileId, userId, name });
  return filesRepo.findOwnedFile(fileId, userId);
}

export async function deleteFile({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  await filesRepo.softDeleteFile(fileId, userId);
}

export async function getPreviewUrl({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  if (file.status !== 'READY') throw new ConflictError('File not ready', 'FILE_NOT_READY');

  const url = await getPresignedDownloadUrl({
    storageKey: file.storageKey,
    filename: file.originalName,
    disposition: 'inline',
  });
  return { url };
}

export async function getZipContents({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  if (file.status !== 'READY') throw new ConflictError('File not ready', 'FILE_NOT_READY');
  if (file.mimeType !== 'application/zip') {
    throw new ConflictError('Not a zip file', 'NOT_A_ZIP');
  }
  return getZipListing({ storageKey: file.storageKey, sizeBytes: file.sizeBytes });
}

export async function listTrash({ userId }) {
  return filesRepo.listTrashedFiles(userId);
}

export async function restoreFile({ fileId, userId }) {
  const file = await filesRepo.findTrashedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  return filesRepo.restoreFile(fileId, userId);
}

export async function listFiles({ userId, cursor, limit, q, sort, folderId, view }) {
  return filesRepo.listOwnedFiles(userId, { cursor, limit, q, sort, folderId, view });
}

export async function getUsage({ userId }) {
  const usedBytes = await filesRepo.getUsageBytes(userId);
  return { usedBytes, limitBytes: STORAGE_LIMIT_BYTES };
}

export async function getStats({ userId }) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [usedBytes, totalFiles, publicFileCount, recentUploadCount, byMimeTypeRaw] = await Promise.all([
    filesRepo.getUsageBytes(userId),
    filesRepo.getFileCount(userId),
    filesRepo.getPublicFileCount(userId),
    filesRepo.getRecentUploadCount(userId, since),
    filesRepo.getMimeTypeBreakdown(userId),
  ]);

  const byMimeType = byMimeTypeRaw.map((g) => ({
    mimeType: g.mimeType,
    count: g._count._all,
    sizeBytes: g._sum.sizeBytes ?? 0n,
  }));

  return { usedBytes, limitBytes: STORAGE_LIMIT_BYTES, totalFiles, publicFileCount, recentUploadCount, byMimeType };
}

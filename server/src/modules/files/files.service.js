import crypto from 'node:crypto';
import path from 'node:path';
import { nanoid } from 'nanoid';
import * as filesRepo from './files.repository.js';
import { validateFileIntent, computePartSize, sniffMimeType } from '../../services/storage.service.js';
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
import { NotFoundError, ConflictError } from '../../lib/errors.js';

export async function createUploadIntent({ userId, filename, sizeBytes, mimeType }) {
  const { sanitizedName, mimeType: resolvedMimeType } = validateFileIntent({ filename, sizeBytes, mimeType });
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

export async function updateFile({ fileId, userId, name, visibility }) {
  if (visibility) await updateFileVisibility({ fileId, userId, visibility });
  if (name) return renameFile({ fileId, userId, name });
  return filesRepo.findOwnedFile(fileId, userId);
}

export async function deleteFile({ fileId, userId }) {
  const file = await filesRepo.findOwnedFile(fileId, userId);
  if (!file) throw new NotFoundError();
  await filesRepo.softDeleteFile(fileId, userId);
}

export async function listFiles({ userId, cursor, limit, q, sort }) {
  return filesRepo.listOwnedFiles(userId, { cursor, limit, q, sort });
}

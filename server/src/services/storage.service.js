import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import {
  MAX_FILE_SIZE,
  PART_SIZE_MIN,
  PART_SIZE_DEFAULT,
  MAX_PARTS,
  ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS,
  EXTENSION_MIME_FALLBACK,
} from '../config/upload.constants.js';
import { PayloadTooLargeError, UnsupportedMediaError } from '../lib/errors.js';
import { getRangedBytes } from './upload.service.js';

// Deterministic — same input always returns the same output. Never
// recompute after the fact; the caller stores this on the DB row and
// treats it as fixed for the life of that upload.
export function computePartSize(sizeBytes) {
  const size = Number(sizeBytes);
  const parts = Math.ceil(size / PART_SIZE_DEFAULT);
  if (parts <= MAX_PARTS) return PART_SIZE_DEFAULT;
  return Math.ceil(size / MAX_PARTS / PART_SIZE_MIN) * PART_SIZE_MIN;
}

export function validateFileIntent({ filename, sizeBytes, mimeType }) {
  const size = Number(sizeBytes);
  if (!(size > 0) || size > MAX_FILE_SIZE) {
    throw new PayloadTooLargeError(`File size must be between 1 byte and ${MAX_FILE_SIZE} bytes`);
  }

  const sanitized = path
    .basename(filename)
    .replace(/\0/g, '')
    .slice(0, 255);

  const ext = path.extname(sanitized).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new UnsupportedMediaError(`File extension not allowed: ${ext}`);
  }

  // Browsers often fail to report a real MIME type (empty string, or a
  // generic octet-stream fallback) for perfectly valid files — trust the
  // extension in that case rather than reject outright. This is only a
  // pre-filter for UX; sniffMimeType() re-checks real bytes after upload.
  let effectiveMimeType = mimeType;
  if (!mimeType || mimeType === 'application/octet-stream') {
    effectiveMimeType = EXTENSION_MIME_FALLBACK[ext] ?? mimeType;
  }

  if (!ALLOWED_MIME_TYPES.has(effectiveMimeType)) {
    throw new UnsupportedMediaError(`MIME type not allowed: ${effectiveMimeType}`);
  }

  return { sanitizedName: sanitized, mimeType: effectiveMimeType };
}

export async function sniffMimeType(storageKey) {
  const bytes = await getRangedBytes({ storageKey, start: 0, end: 4100 });
  const detected = await fileTypeFromBuffer(bytes);
  const mimeType = detected?.mime;

  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new UnsupportedMediaError(`Detected file content is not an allowed type: ${mimeType ?? 'unknown'}`);
  }

  return mimeType;
}

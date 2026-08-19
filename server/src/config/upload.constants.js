export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB hard limit
export const PART_SIZE_MIN = 5 * 1024 * 1024; // 5 MB, S3 minimum
export const PART_SIZE_DEFAULT = 10 * 1024 * 1024; // 10 MB default
export const MAX_PARTS = 9500; // S3 caps at 10k, stay safe
export const UPLOAD_EXPIRY_DAYS = 7; // matches S3 lifecycle rule
export const STORAGE_LIMIT_BYTES = 2 * 1024 ** 3; // 2 GiB per-user cap, uniform for all users
export const TRASH_RETENTION_DAYS = 30; // soft-deleted files are restorable until the reconciler purges them
export const PRESIGNED_URL_EXPIRES = 3600; // 1 hour for part upload
export const DOWNLOAD_URL_EXPIRES = 60; // 60 seconds for download

// Allowlist, never a denylist — files not in this list are rejected at intent time

export const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const AVATAR_URL_EXPIRES = 3600; // 1 hour — long enough to survive a normal session between /me refetches

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/quicktime', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
  'application/pdf',
  'application/zip', 'application/x-tar', 'application/gzip',
  'application/json', 'application/xml',
  'text/plain', 'text/csv', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword', 'application/vnd.ms-excel',
]);

// Reject these even if the client-declared MIME looks safe
export const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.mjs',
  '.html', '.htm', '.svg', '.xml', '.php', '.py', '.rb', '.pl',
]);

// Some browsers/OSes report a non-standard MIME type for a format that
// does have a standard one — e.g. Windows Chrome reports .zip files as
// application/x-zip-compressed instead of the standard application/zip.
// Normalize these before checking ALLOWED_MIME_TYPES.
export const MIME_TYPE_ALIASES = {
  'application/x-zip-compressed': 'application/zip',
  'application/x-zip': 'application/zip',
};

// Used only when the browser reports no MIME type (or a generic
// octet-stream fallback) for a file whose extension we otherwise support.
export const EXTENSION_MIME_FALLBACK = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip', '.tar': 'application/x-tar', '.gz': 'application/gzip',
  '.json': 'application/json',
  '.txt': 'text/plain', '.csv': 'text/csv', '.md': 'text/markdown',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc': 'application/msword', '.xls': 'application/vnd.ms-excel',
};

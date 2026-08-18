import { apiRequest, getAccessToken } from './api';

export function createUploadIntent({ filename, sizeBytes, mimeType, folderId }) {
  return apiRequest('/api/files/upload-intent', {
    method: 'POST',
    body: JSON.stringify({ filename, sizeBytes, mimeType, folderId: folderId ?? null }),
  });
}

export function getUploadStatus(fileId) {
  return apiRequest(`/api/files/${fileId}/upload-status`);
}

export function resumeUpload(fileId, missingParts) {
  return apiRequest(`/api/files/${fileId}/resume`, {
    method: 'POST',
    body: JSON.stringify({ missingParts }),
  });
}

export function completeUpload(fileId) {
  return apiRequest(`/api/files/${fileId}/complete`, { method: 'POST' });
}

export function abortUpload(fileId) {
  return apiRequest(`/api/files/${fileId}/abort`, { method: 'POST' });
}

export function listFiles({ cursor, limit, q, sort, folderId, view } = {}) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);
  if (folderId) params.set('folderId', folderId);
  if (view) params.set('view', view);
  const qs = params.toString();
  return apiRequest(`/api/files${qs ? `?${qs}` : ''}`);
}

export function getUsage() {
  return apiRequest('/api/files/usage');
}

export function updateFile(fileId, patch) {
  return apiRequest(`/api/files/${fileId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteFile(fileId) {
  return apiRequest(`/api/files/${fileId}`, { method: 'DELETE' });
}

export function listTrash() {
  return apiRequest('/api/files/trash');
}

export function restoreFile(fileId) {
  return apiRequest(`/api/files/${fileId}/restore`, { method: 'POST' });
}

export function getZipContents(fileId) {
  return apiRequest(`/api/files/${fileId}/preview/zip-contents`);
}

// Distinct from downloadFile()'s resolveFileUrl — this asks for an
// inline-disposition URL so the browser renders the file in place
// (iframe/img/video) instead of trying to download it.
export function getPreviewUrl(fileId) {
  return apiRequest(`/api/files/${fileId}/preview-url`).then((res) => res.data.url);
}

export function getShareMeta(slug) {
  return apiRequest(`/api/share/${slug}`);
}

// Fetch just resolves the server's 302 to the presigned (attachment-
// disposition) S3 URL — needed since a plain <a href> to
// /api/files/:id/download can't carry the bearer token the endpoint
// requires. Downloads never buffer the file through JS memory — the
// browser navigates to the resolved URL natively.
export async function downloadFile(fileId) {
  const res = await fetch(`/api/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error('Could not resolve file URL');
  window.location.href = res.url;
}

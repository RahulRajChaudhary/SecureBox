import { apiRequest, getAccessToken } from './api';

export function createUploadIntent({ filename, sizeBytes, mimeType }) {
  return apiRequest('/api/files/upload-intent', {
    method: 'POST',
    body: JSON.stringify({ filename, sizeBytes, mimeType }),
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

export function listFiles({ cursor, limit, q, sort } = {}) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);
  const qs = params.toString();
  return apiRequest(`/api/files${qs ? `?${qs}` : ''}`);
}

export function updateFile(fileId, patch) {
  return apiRequest(`/api/files/${fileId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteFile(fileId) {
  return apiRequest(`/api/files/${fileId}`, { method: 'DELETE' });
}

export function getShareMeta(slug) {
  return apiRequest(`/api/share/${slug}`);
}

// Downloads never buffer the file through JS memory. Fetch just resolves
// the server's 302 to the presigned S3 URL, then the browser navigates
// there natively — same trick the auth header requires since a plain
// <a href> to /api/files/:id/download can't carry the bearer token.
export async function downloadFile(fileId) {
  const res = await fetch(`/api/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error('Download failed');
  window.location.href = res.url;
}

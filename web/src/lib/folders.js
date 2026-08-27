import { apiRequest } from './api';

export function listFolders(parentId, q) {
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', parentId);
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/folders${qs}`);
}

export function listFavoriteFolders() {
  return apiRequest('/api/folders/favorites');
}

export function getFolder(folderId) {
  return apiRequest(`/api/folders/${folderId}`);
}

export function createFolder({ name, parentId }) {
  return apiRequest('/api/folders', { method: 'POST', body: JSON.stringify({ name, parentId: parentId ?? null }) });
}

export function updateFolder(folderId, patch) {
  return apiRequest(`/api/folders/${folderId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteFolder(folderId) {
  return apiRequest(`/api/folders/${folderId}`, { method: 'DELETE' });
}

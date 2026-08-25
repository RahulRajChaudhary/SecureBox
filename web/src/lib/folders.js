import { apiRequest } from './api';

export function listFolders(parentId) {
  const qs = parentId ? `?parentId=${parentId}` : '';
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

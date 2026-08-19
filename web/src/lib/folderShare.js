import { apiRequest } from './api';

export function getFolderShareMeta(slug) {
  return apiRequest(`/api/share/folder/${slug}`);
}

export function getFolderShareBrowse(slug, folderId) {
  return apiRequest(`/api/share/folder/${slug}/browse/${folderId}`);
}

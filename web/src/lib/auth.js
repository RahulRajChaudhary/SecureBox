import { apiRequest } from './api';

export function getMe() {
  return apiRequest('/api/auth/me');
}

export function getAvatarUploadUrl(mimeType) {
  return apiRequest('/api/auth/me/avatar', {
    method: 'PUT',
    body: JSON.stringify({ mimeType }),
  });
}

export function confirmAvatar() {
  return apiRequest('/api/auth/me/avatar/confirm', { method: 'POST' });
}

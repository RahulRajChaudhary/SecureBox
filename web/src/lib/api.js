const AUTH_PATHS = new Set([
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

let accessToken = null;
let onUnauthorized = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      accessToken = null;
      return null;
    }
    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function request(path, options = {}, retry = true) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(path, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && retry && !AUTH_PATHS.has(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, options, false);
    onUnauthorized?.();
  }

  return res;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export function getAccessToken() {
  return accessToken;
}

export async function apiRequest(path, options) {
  const res = await request(path, options);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error ?? 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.code;
    err.details = data?.details;
    throw err;
  }
  return data;
}

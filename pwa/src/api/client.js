import { getAccessToken, getRefreshToken, setTokens, logout } from '../auth/store.js';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

let refreshPromise = null;

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(`${API_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.error ?? 'Token refresh failed');
  }

  setTokens(data);
  return data.access_token;
}

async function getValidAccessToken() {
  const token = getAccessToken();
  if (!token) return null;
  return token;
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured');
  }

  const { method = 'GET', body, auth = true, retry = true } = options;

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getValidAccessToken();
    if (!token) {
      logout();
      throw new Error('Not authenticated');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && retry) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
      return apiFetch(path, { ...options, retry: false });
    } catch {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  return data;
}

export function getApiUrl() {
  return API_URL;
}

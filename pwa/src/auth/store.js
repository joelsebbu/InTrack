const STORAGE_KEY = 'intrack_auth';

export function getTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setTokens(tokens) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type ?? 'Bearer',
    }),
  );
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
  return getTokens() !== null;
}

export function getAccessToken() {
  return getTokens()?.access_token ?? null;
}

export function getRefreshToken() {
  return getTokens()?.refresh_token ?? null;
}

export function logout() {
  clearTokens();
  window.location.hash = '#/login';
}

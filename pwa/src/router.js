const routes = new Map();
let currentCleanup = null;

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

function getRoutePath() {
  const hash = window.location.hash.slice(1) || '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export async function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

export async function renderRoute() {
  const path = getRoutePath();

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const handler = routes.get(path) ?? routes.get('/');
  if (!handler) return;

  const outlet = document.getElementById('app');
  if (!outlet) return;

  const cleanup = await handler(outlet, { path });
  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    renderRoute();
  });
  return renderRoute();
}

export function getCurrentPath() {
  return getRoutePath();
}

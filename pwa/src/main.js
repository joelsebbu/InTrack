import './styles/tokens.css';
import './styles/base.css';
import './styles/glass.css';
import './styles/components.css';

import { initRouter, registerRoute } from './router.js';
import { isAuthenticated } from './auth/store.js';
import { initInstallPrompt } from './components/install-banner.js';
import { renderLoginPage } from './pages/login.js';
import { renderHomePage } from './pages/home.js';
import { renderReportsPage } from './pages/reports.js';
import { renderSettingsPage } from './pages/settings.js';

function requireAuth(handler) {
  return async (outlet, ctx) => {
    if (!isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }
    return handler(outlet, ctx);
  };
}

registerRoute('/login', renderLoginPage);
registerRoute('/', requireAuth(renderHomePage));
registerRoute('/reports', requireAuth(renderReportsPage));
registerRoute('/settings', requireAuth(renderSettingsPage));

initInstallPrompt();

document.getElementById('app').innerHTML = '<div class="boot-loading">Loading InTrack…</div>';

initRouter();

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {
    // PWA registration optional in dev without plugin virtual module
  });
}

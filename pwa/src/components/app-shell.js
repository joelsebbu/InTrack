import { renderBottomNav } from './bottom-nav.js';
import { destroyAllGlass } from './glass-card.js';

export function renderAppShell({ showNav = true, activePath = '/' } = {}) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-shell">
      <main class="app-shell__main" id="page-outlet"></main>
      ${showNav ? '<div class="app-shell__nav" id="bottom-nav-host"></div>' : ''}
      ${showNav ? '<div class="app-shell__fab-host" id="fab-host"></div>' : ''}
    </div>
  `;

  if (showNav) {
    renderBottomNav(document.getElementById('bottom-nav-host'), activePath);
  }

  return document.getElementById('page-outlet');
}

export function setPageContent(html) {
  const outlet = document.getElementById('page-outlet');
  if (outlet) outlet.innerHTML = html;
  return outlet;
}

export function getFabHost() {
  return document.getElementById('fab-host');
}

export function getNavHost() {
  return document.getElementById('bottom-nav-host');
}

export function cleanupAppShell() {
  destroyAllGlass();
}

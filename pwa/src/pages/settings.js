import { logout } from '../auth/store.js';
import { renderAppShell, setPageContent, getNavHost } from '../components/app-shell.js';
import { applyGlassToElement, destroyGlass } from '../components/glass-card.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { renderInstallSection } from '../components/install-banner.js';

export async function renderSettingsPage() {
  renderAppShell({ showNav: true, activePath: '/settings' });

  const page = setPageContent(`
    <div class="settings-page">
      <header class="page-header">
        <h1>Settings</h1>
      </header>
      <section class="settings-section glass-surface" data-glass="settings-install">
        <h2>Install app</h2>
        <div id="install-section"></div>
      </section>
      <section class="settings-section glass-surface" data-glass="settings-about">
        <h2>About</h2>
        <p class="settings-note">InTrack v1.0.0</p>
        <p class="settings-note">Personal expense tracker · amounts in INR (₹)</p>
      </section>
      <button type="button" class="btn btn--danger" id="logout-btn">Log out</button>
    </div>
  `);

  renderInstallSection(page.querySelector('#install-section'));

  await applyGlassToElement(page.querySelector('[data-glass="settings-install"]'), {}, 'settings-install');
  await applyGlassToElement(page.querySelector('[data-glass="settings-about"]'), {}, 'settings-about');

  const navHost = getNavHost();
  if (navHost) {
    renderBottomNav(navHost, '/settings');
    const navEl = navHost.querySelector('.bottom-nav');
    if (navEl) {
      navEl.dataset.glass = 'nav';
      await applyGlassToElement(navEl, { radius: 24, depth: 10 }, 'nav');
    }
  }

  page.querySelector('#logout-btn').addEventListener('click', logout);

  return () => {
    destroyGlass('settings-install');
    destroyGlass('settings-about');
    destroyGlass('nav');
  };
}

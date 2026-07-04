import { navigate, getCurrentPath } from '../router.js';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/reports', label: 'Reports', icon: '▤' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export function renderBottomNav(container, activePath = getCurrentPath()) {
  container.innerHTML = `
    <nav class="bottom-nav" data-glass="nav">
      ${NAV_ITEMS.map(
        (item) => `
        <button
          type="button"
          class="bottom-nav__item ${activePath === item.path ? 'bottom-nav__item--active' : ''}"
          data-nav="${item.path}"
          aria-label="${item.label}"
        >
          <span class="bottom-nav__icon" aria-hidden="true">${item.icon}</span>
          <span class="bottom-nav__label">${item.label}</span>
        </button>
      `,
      ).join('')}
    </nav>
  `;

  container.querySelectorAll('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      navigate(button.dataset.nav);
    });
  });
}

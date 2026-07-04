let deferredPrompt = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.dispatchEvent(new CustomEvent('intrack:install-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('intrack:install-completed'));
  });
}

export function canInstall() {
  return deferredPrompt !== null;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function renderInstallSection(container) {
  const ios = isIOS();
  const standalone = isStandalone();
  const installable = canInstall();

  if (standalone) {
    container.innerHTML = `<p class="settings-note">InTrack is installed on this device.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="install-section">
      ${
        installable
          ? `<button type="button" class="btn btn--secondary" id="install-app-btn">Install app</button>`
          : ios
            ? `<p class="settings-note">To install on iOS: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.</p>`
            : `<p class="settings-note">Install is available in supported browsers after visiting the site a few times.</p>`
      }
    </div>
  `;

  container.querySelector('#install-app-btn')?.addEventListener('click', async () => {
    const accepted = await promptInstall();
    if (accepted) {
      renderInstallSection(container);
    }
  });

  window.addEventListener('intrack:install-available', () => renderInstallSection(container));
  window.addEventListener('intrack:install-completed', () => renderInstallSection(container));
}

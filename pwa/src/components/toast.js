let toastTimer = null;

export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  if (toastTimer) clearTimeout(toastTimer);

  container.innerHTML = `<div class="toast toast--${type}">${message}</div>`;
  container.classList.add('toast-container--visible');

  toastTimer = setTimeout(() => {
    container.classList.remove('toast-container--visible');
  }, 3000);
}

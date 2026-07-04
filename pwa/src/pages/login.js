import { login } from '../api/auth.js';
import { setTokens, isAuthenticated } from '../auth/store.js';
import { navigate } from '../router.js';
import { applyGlassToElement } from '../components/glass-card.js';

export async function renderLoginPage() {
  if (isAuthenticated()) {
    await navigate('/');
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card glass-surface" data-glass="login">
        <div class="login-card__brand">
          <span class="login-card__mark">₹</span>
          <h1>InTrack</h1>
          <p>Track your expenses</p>
        </div>
        <form class="login-form" id="login-form">
          <label class="field">
            <span>Username</span>
            <input type="text" name="username" autocomplete="username" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input type="password" name="password" autocomplete="current-password" required />
          </label>
          <p class="form-error" id="login-error" hidden></p>
          <button type="submit" class="btn btn--primary">Sign in</button>
        </form>
      </div>
    </div>
  `;

  const loginCard = app.querySelector('[data-glass="login"]');
  await applyGlassToElement(loginCard, { radius: 24 }, 'login');

  const form = app.querySelector('#login-form');
  const errorEl = app.querySelector('#login-error');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;

    const formData = new FormData(form);
    try {
      const tokens = await login(
        String(formData.get('username')),
        String(formData.get('password')),
      );
      setTokens(tokens);
      await navigate('/');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  return () => {};
}

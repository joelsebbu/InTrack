import { fetchMetadata } from '../api/metadata.js';
import { addExpense } from '../api/expenses.js';
import { toDatetimeLocalValue, datetimeLocalToISO } from '../utils/dates.js';
import { showToast } from './toast.js';

export function createAddSheet({ onSuccess }) {
  let metadata = { categories: {} };
  let overlay = null;

  function close() {
    overlay?.remove();
    overlay = null;
    document.body.classList.remove('sheet-open');
  }

  function renderSubcategoryOptions(category) {
    const subs = metadata.categories[category] ?? [];
    return subs.map((sub) => `<option value="${escapeHtml(sub)}"></option>`).join('');
  }

  function renderCategoryOptions() {
    return Object.keys(metadata.categories)
      .map((cat) => `<option value="${escapeHtml(cat)}"></option>`)
      .join('');
  }

  async function open() {
    try {
      metadata = await fetchMetadata();
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }

    overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML = `
      <div class="sheet-backdrop" data-close></div>
      <div class="sheet-panel" data-glass="sheet" role="dialog" aria-labelledby="add-sheet-title">
        <div class="sheet-panel__handle"></div>
        <header class="sheet-panel__header">
          <h2 id="add-sheet-title">Add expense</h2>
          <button type="button" class="sheet-panel__close" data-close aria-label="Close">&times;</button>
        </header>
        <form class="add-form" id="add-expense-form">
          <label class="field">
            <span>Amount (INR)</span>
            <input type="number" name="amount" min="0.01" step="0.01" inputmode="decimal" required placeholder="0.00" />
          </label>
          <label class="field">
            <span>Category</span>
            <input type="text" name="category" list="category-list" required placeholder="Food, Travel…" autocomplete="off" />
            <datalist id="category-list">${renderCategoryOptions()}</datalist>
          </label>
          <label class="field">
            <span>Subcategory</span>
            <input type="text" name="subcategory" list="subcategory-list" required placeholder="Groceries, Cab…" autocomplete="off" />
            <datalist id="subcategory-list"></datalist>
          </label>
          <label class="field">
            <span>Note <small>(optional)</small></span>
            <textarea name="message" rows="2" placeholder="What was this for?"></textarea>
          </label>
          <label class="field">
            <span>Date & time</span>
            <input type="datetime-local" name="timestamp" value="${toDatetimeLocalValue()}" required />
          </label>
          <p class="form-error" id="add-form-error" hidden></p>
          <button type="submit" class="btn btn--primary">Save expense</button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('sheet-open');

    const categoryInput = overlay.querySelector('[name="category"]');
    const subcategoryList = overlay.querySelector('#subcategory-list');

    categoryInput.addEventListener('input', () => {
      subcategoryList.innerHTML = renderSubcategoryOptions(categoryInput.value.trim());
    });

    overlay.querySelectorAll('[data-close]').forEach((el) => {
      el.addEventListener('click', close);
    });

    overlay.querySelector('#add-expense-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      const errorEl = overlay.querySelector('#add-form-error');
      const submitBtn = form.querySelector('[type="submit"]');

      errorEl.hidden = true;
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const amount = Number(formData.get('amount'));
      const category = String(formData.get('category')).trim();
      const subcategory = String(formData.get('subcategory')).trim();
      const message = String(formData.get('message')).trim();
      const timestamp = datetimeLocalToISO(String(formData.get('timestamp')));

      try {
        await addExpense({
          amount,
          category,
          subcategory,
          timestamp,
          ...(message ? { message } : {}),
        });
        close();
        showToast('Expense added');
        await onSuccess?.();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      } finally {
        submitBtn.disabled = false;
      }
    });

    return overlay;
  }

  return { open, close };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

import { fetchRecentReport } from '../api/expenses.js';
import { renderAppShell, setPageContent, getFabHost, getNavHost } from '../components/app-shell.js';
import { renderExpenseList } from '../components/expense-list.js';
import { createAddSheet } from '../components/add-sheet.js';
import { applyGlassToElement, destroyGlass } from '../components/glass-card.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { formatINR } from '../utils/currency.js';
import { formatRange } from '../utils/dates.js';
import { flattenExpenses, topCategories } from '../utils/flatten-expenses.js';

export async function renderHomePage() {
  renderAppShell({ showNav: true, activePath: '/' });

  const page = setPageContent(`
    <div class="home-page">
      <header class="page-header">
        <h1>InTrack</h1>
      </header>
      <div class="home-page__content">
        <div id="home-loading" class="loading-state">Loading…</div>
        <div id="home-content" hidden></div>
      </div>
    </div>
  `);

  const addSheet = createAddSheet({ onSuccess: loadData });

  const fabHost = getFabHost();
  fabHost.innerHTML = `
    <button type="button" class="fab" id="add-expense-btn">+ Add expense</button>
  `;
  fabHost.querySelector('#add-expense-btn').addEventListener('click', async () => {
    const sheetEl = await addSheet.open();
    if (sheetEl) {
      const panel = sheetEl.querySelector('[data-glass="sheet"]');
      await applyGlassToElement(panel, { radius: 24 }, 'sheet');
    }
  });

  await loadData();

  async function loadData() {
    const loadingEl = page.querySelector('#home-loading');
    const contentEl = page.querySelector('#home-content');

    loadingEl.hidden = false;
    contentEl.hidden = true;

    try {
      const data = await fetchRecentReport(7);
      const expenses = flattenExpenses(data.raw);
      const categories = topCategories(data.report.byCategory);

      contentEl.innerHTML = `
        <section class="summary-card glass-surface" data-glass="summary">
          <p class="summary-card__eyebrow">Last 7 days</p>
          <p class="summary-card__range">${formatRange(data.range.from, data.range.to)}</p>
          <p class="summary-card__total">${formatINR(data.report.totalAmount)}</p>
          <p class="summary-card__count">${data.report.entryCount} expense${data.report.entryCount === 1 ? '' : 's'}</p>
          ${
            categories.length
              ? `<div class="summary-card__chips">${categories
                  .map(
                    (cat) =>
                      `<span class="chip">${cat.name} · ${formatINR(cat.amount)}</span>`,
                  )
                  .join('')}</div>`
              : ''
          }
        </section>
        <div id="expense-list-host"></div>
      `;

      renderExpenseList(contentEl.querySelector('#expense-list-host'), expenses);

      loadingEl.hidden = true;
      contentEl.hidden = false;

      const summaryCard = contentEl.querySelector('[data-glass="summary"]');
      await applyGlassToElement(summaryCard, {}, 'summary');

      const navHost = getNavHost();
      if (navHost) {
        renderBottomNav(navHost, '/');
        const navEl = navHost.querySelector('[data-glass="nav"]') ?? navHost.querySelector('.bottom-nav');
        if (navEl) {
          navEl.dataset.glass = 'nav';
          await applyGlassToElement(navEl, { radius: 24, depth: 10 }, 'nav');
        }
      }
    } catch (err) {
      loadingEl.innerHTML = `<p class="error-state">${err.message}</p>`;
      if (!navigator.onLine) {
        loadingEl.innerHTML += `<p class="error-state">You're offline. Expense data requires a connection.</p>`;
      }
    }
  }

  return () => {
    destroyGlass('summary');
    destroyGlass('nav');
    destroyGlass('sheet');
    addSheet.close();
  };
}

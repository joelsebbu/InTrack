import { generateReport } from '../api/reports.js';
import { renderAppShell, setPageContent, getNavHost } from '../components/app-shell.js';
import { applyGlassToElement, destroyGlass } from '../components/glass-card.js';
import { renderBottomNav } from '../components/bottom-nav.js';
import { formatINR } from '../utils/currency.js';
import { formatISTMonthYear, getISTNowParts } from '../utils/dates.js';

export async function renderReportsPage() {
  renderAppShell({ showNav: true, activePath: '/reports' });

  const now = getISTNowParts();
  let reportType = 'month';
  let year = now.year;
  let month = now.month;

  const page = setPageContent(`
    <div class="reports-page">
      <header class="page-header">
        <h1>Reports</h1>
      </header>
      <div class="reports-controls glass-surface" data-glass="reports-controls">
        <div class="segmented">
          <button type="button" class="segmented__btn segmented__btn--active" data-type="month">Month</button>
          <button type="button" class="segmented__btn" data-type="year">Year</button>
        </div>
        <div class="reports-controls__pickers">
          <label class="field field--inline">
            <span>Year</span>
            <input type="number" id="report-year" min="2000" max="2100" value="${year}" />
          </label>
          <label class="field field--inline" id="month-picker">
            <span>Month</span>
            <input type="number" id="report-month" min="1" max="12" value="${month}" />
          </label>
        </div>
        <button type="button" class="btn btn--secondary" id="load-report-btn">Load report</button>
      </div>
      <div id="reports-result" class="reports-result">
        <div class="loading-state" id="reports-loading" hidden>Loading…</div>
        <div id="reports-content"></div>
      </div>
    </div>
  `);

  const controlsEl = page.querySelector('[data-glass="reports-controls"]');
  await applyGlassToElement(controlsEl, {}, 'reports-controls');

  const navHost = getNavHost();
  if (navHost) {
    renderBottomNav(navHost, '/reports');
    const navEl = navHost.querySelector('.bottom-nav');
    if (navEl) {
      navEl.dataset.glass = 'nav';
      await applyGlassToElement(navEl, { radius: 24, depth: 10 }, 'nav');
    }
  }

  const monthPicker = page.querySelector('#month-picker');
  const yearInput = page.querySelector('#report-year');
  const monthInput = page.querySelector('#report-month');
  const contentEl = page.querySelector('#reports-content');
  const loadingEl = page.querySelector('#reports-loading');

  page.querySelectorAll('[data-type]').forEach((button) => {
    button.addEventListener('click', () => {
      reportType = button.dataset.type;
      page.querySelectorAll('[data-type]').forEach((btn) => {
        btn.classList.toggle('segmented__btn--active', btn.dataset.type === reportType);
      });
      monthPicker.hidden = reportType === 'year';
    });
  });

  page.querySelector('#load-report-btn').addEventListener('click', loadReport);
  await loadReport();

  async function loadReport() {
    year = Number(yearInput.value);
    month = Number(monthInput.value);
    loadingEl.hidden = false;
    contentEl.innerHTML = '';

    const request =
      reportType === 'month'
        ? { type: 'month', year, month }
        : { type: 'year', year };

    try {
      const result = await generateReport(request);
      const report = result.data;
      const periodLabel =
        reportType === 'month'
          ? formatISTMonthYear(year, month)
          : String(year);

      const categoryRows = Object.entries(report.byCategory ?? {})
        .sort(([, a], [, b]) => b.amount - a.amount)
        .map(
          ([name, summary]) => `
          <li class="breakdown-row">
            <span>${name}</span>
            <span>${formatINR(summary.amount)} · ${summary.count}</span>
          </li>
        `,
        )
        .join('');

      const subcategoryRows = Object.entries(report.bySubcategory ?? {})
        .sort(([, a], [, b]) => b.amount - a.amount)
        .map(
          ([name, summary]) => `
          <li class="breakdown-row breakdown-row--muted">
            <span>${name}</span>
            <span>${formatINR(summary.amount)} · ${summary.count}</span>
          </li>
        `,
        )
        .join('');

      contentEl.innerHTML = `
        <section class="summary-card glass-surface" data-glass="reports-summary">
          <p class="summary-card__eyebrow">${periodLabel}</p>
          <p class="summary-card__total">${formatINR(report.totalAmount)}</p>
          <p class="summary-card__count">${report.entryCount} expense${report.entryCount === 1 ? '' : 's'}</p>
          <span class="badge">${result.source === 'file' ? 'Saved report' : 'Computed'}</span>
        </section>
        <section class="breakdown-section">
          <h2>By category</h2>
          <ul class="breakdown-list">${categoryRows || '<li class="empty-state">No data</li>'}</ul>
        </section>
        <details class="breakdown-details">
          <summary>By subcategory</summary>
          <ul class="breakdown-list">${subcategoryRows || '<li class="empty-state">No data</li>'}</ul>
        </details>
      `;

      const summaryCard = contentEl.querySelector('[data-glass="reports-summary"]');
      await applyGlassToElement(summaryCard, {}, 'reports-summary');
    } catch (err) {
      contentEl.innerHTML = `<p class="error-state">${err.message}</p>`;
    } finally {
      loadingEl.hidden = true;
    }
  }

  return () => {
    destroyGlass('reports-controls');
    destroyGlass('reports-summary');
    destroyGlass('nav');
  };
}

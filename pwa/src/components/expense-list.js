import { formatINR } from '../utils/currency.js';
import { formatISTTime, dayLabel } from '../utils/dates.js';
import { groupExpensesByDay } from '../utils/flatten-expenses.js';

export function renderExpenseList(container, expenses) {
  if (!expenses.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No expenses in the last 7 days</p>
      </div>
    `;
    return;
  }

  const groups = groupExpensesByDay(expenses);
  const sortedDays = [...groups.keys()].sort((a, b) => b.localeCompare(a));

  container.innerHTML = sortedDays
    .map((date) => {
      const items = groups.get(date);
      return `
        <section class="expense-day">
          <h3 class="expense-day__heading">${dayLabel(date)}</h3>
          <ul class="expense-list">
            ${items
              .map(
                (entry) => `
              <li class="expense-row">
                <div class="expense-row__main">
                  <span class="expense-row__amount">${formatINR(entry.amount)}</span>
                  <span class="expense-row__category">${escapeHtml(entry.category)} / ${escapeHtml(entry.subcategory)}</span>
                  ${entry.message ? `<span class="expense-row__message">${escapeHtml(entry.message)}</span>` : ''}
                </div>
                <time class="expense-row__time">${formatISTTime(entry.timestamp)}</time>
              </li>
            `,
              )
              .join('')}
          </ul>
        </section>
      `;
    })
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

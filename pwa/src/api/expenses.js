import { apiFetch } from './client.js';

export async function addExpense(payload) {
  return apiFetch('/add', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchRecentReport(days = 7) {
  return apiFetch('/reports/recent', {
    method: 'POST',
    body: { days },
  });
}

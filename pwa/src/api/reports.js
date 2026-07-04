import { apiFetch } from './client.js';

export async function generateReport(request) {
  return apiFetch('/reports/generate', {
    method: 'POST',
    body: request,
  });
}

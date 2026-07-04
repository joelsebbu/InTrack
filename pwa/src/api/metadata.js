import { apiFetch } from './client.js';

export async function fetchMetadata() {
  return apiFetch('/metadata');
}

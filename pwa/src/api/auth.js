import { apiFetch } from './client.js';

export async function login(username, password) {
  return apiFetch('/oauth/token', {
    method: 'POST',
    auth: false,
    body: {
      grant_type: 'password',
      username,
      password,
    },
  });
}

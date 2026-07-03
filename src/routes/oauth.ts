import { handleTokenRequest, parseTokenRequest } from '../auth/oauth';

export async function handleOAuthToken(body: unknown) {
  const request = parseTokenRequest(body);
  return handleTokenRequest(request);
}

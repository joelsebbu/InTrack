import { AppError } from '../util/errors';
import { validateCredentials } from './credentials';
import { issueTokenPair, verifyRefreshToken } from './tokens';

export interface TokenRequest {
  grant_type: string;
  username?: string;
  password?: string;
  refresh_token?: string;
}

export function parseTokenRequest(body: unknown): TokenRequest {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object or form fields');
  }

  const data = body as Record<string, unknown>;
  const grant_type = data.grant_type;

  if (typeof grant_type !== 'string' || !grant_type) {
    throw new AppError('grant_type is required');
  }

  return {
    grant_type,
    username: typeof data.username === 'string' ? data.username : undefined,
    password: typeof data.password === 'string' ? data.password : undefined,
    refresh_token:
      typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
  };
}

export async function handleTokenRequest(request: TokenRequest) {
  if (request.grant_type === 'password') {
    if (!request.username || !request.password) {
      throw new AppError('username and password are required for password grant');
    }

    const username = await validateCredentials(request.username, request.password);
    return issueTokenPair(username);
  }

  if (request.grant_type === 'refresh_token') {
    if (!request.refresh_token) {
      throw new AppError('refresh_token is required for refresh_token grant');
    }

    const username = await verifyRefreshToken(request.refresh_token);
    return issueTokenPair(username);
  }

  throw new AppError('Unsupported grant_type');
}

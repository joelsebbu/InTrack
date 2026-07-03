import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { AppError } from '../util/errors';
import { verifyAccessToken } from './tokens';

export async function requireAuth(event: APIGatewayProxyEventV2): Promise<string> {
  const header =
    event.headers?.authorization ?? event.headers?.Authorization ?? '';

  if (!header.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401);
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new AppError('Missing access token', 401);
  }

  return verifyAccessToken(token);
}

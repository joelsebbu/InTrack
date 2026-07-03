import { timingSafeEqual } from 'crypto';
import { AppError } from '../util/errors';
import { getAuthConfig } from './config';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function validateCredentials(
  username: string,
  password: string,
): Promise<string> {
  const config = await getAuthConfig();

  if (!safeEqual(username, config.username) || !safeEqual(password, config.password)) {
    throw new AppError('Invalid username or password', 401);
  }

  return config.username;
}

import { SignJWT, jwtVerify } from 'jose';
import { AppError } from '../util/errors';
import { getAuthConfig } from './config';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

type TokenType = 'access' | 'refresh';

interface TokenPayload {
  sub: string;
  typ: TokenType;
}

async function getSecretKey(): Promise<Uint8Array> {
  const config = await getAuthConfig();
  return new TextEncoder().encode(config.jwtSecret);
}

export async function issueTokenPair(username: string) {
  const secretKey = await getSecretKey();
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await new SignJWT({ typ: 'access' satisfies TokenType })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TOKEN_TTL_SECONDS)
    .sign(secretKey);

  const refreshToken = await new SignJWT({ typ: 'refresh' satisfies TokenType })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TOKEN_TTL_SECONDS)
    .sign(secretKey);

  return {
    access_token: accessToken,
    token_type: 'Bearer' as const,
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
  };
}

export async function verifyAccessToken(token: string): Promise<string> {
  const secretKey = await getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (payload.typ !== 'access' || typeof payload.sub !== 'string') {
      throw new AppError('Invalid access token', 401);
    }

    return payload.sub;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('Invalid or expired access token', 401);
  }
}

export async function verifyRefreshToken(token: string): Promise<string> {
  const secretKey = await getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (payload.typ !== 'refresh' || typeof payload.sub !== 'string') {
      throw new AppError('Invalid refresh token', 401);
    }

    return payload.sub;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

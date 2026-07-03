import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { AppError } from '../util/errors';

export interface AuthConfig {
  username: string;
  password: string;
  jwtSecret: string;
}

let cachedConfig: AuthConfig | null = null;

export async function getAuthConfig(): Promise<AuthConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const secretArn = process.env.AUTH_SECRET_ARN;
  if (!secretArn) {
    throw new AppError('AUTH_SECRET_ARN is not configured', 500);
  }

  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );

  if (!result.SecretString) {
    throw new AppError('Auth secret is empty', 500);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.SecretString);
  } catch {
    throw new AppError('Auth secret must be valid JSON', 500);
  }

  const data = parsed as Record<string, unknown>;
  if (
    typeof data.username !== 'string' ||
    typeof data.password !== 'string' ||
    typeof data.jwtSecret !== 'string' ||
    !data.username ||
    !data.password ||
    !data.jwtSecret
  ) {
    throw new AppError(
      'Auth secret must contain username, password, and jwtSecret',
      500,
    );
  }

  cachedConfig = {
    username: data.username,
    password: data.password,
    jwtSecret: data.jwtSecret,
  };

  return cachedConfig;
}

import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { AppError } from './errors';

export function parseRequestBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;

  const contentType =
    event.headers?.['content-type'] ??
    event.headers?.['Content-Type'] ??
    '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError('Invalid request body');
  }
}

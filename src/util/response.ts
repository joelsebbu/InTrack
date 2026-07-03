import type { APIGatewayProxyResultV2 } from 'aws-lambda';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

export function ok(body: unknown): APIGatewayProxyResultV2 {
  return jsonResponse(200, body);
}

export function badRequest(message: string): APIGatewayProxyResultV2 {
  return jsonResponse(400, { error: message });
}

export function serverError(message: string, retryable = false): APIGatewayProxyResultV2 {
  return jsonResponse(502, { error: message, retryable });
}

export function conflict(message: string): APIGatewayProxyResultV2 {
  return jsonResponse(409, { error: message, retryable: true });
}

import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { requireAuth } from './auth/middleware';
import { GitLabClient } from './gitlab/client';
import { handleAdd } from './routes/add';
import { handleGetMetadata } from './routes/metadata';
import { handleOAuthToken } from './routes/oauth';
import { handleRecentReport } from './routes/recent';
import {
  handleGenerateReport,
  handleRefreshReport,
  handleSaveReport,
} from './routes/reports';
import { parseRequestBody } from './util/body';
import { isAppError } from './util/errors';
import {
  badRequest,
  conflict,
  ok,
  serverError,
  unauthorized,
} from './util/response';

const client = new GitLabClient();

const PROTECTED_ROUTES = new Set([
  'GET /metadata',
  'POST /add',
  'POST /reports/generate',
  'POST /reports/save',
  'POST /reports/refresh',
  'POST /reports/recent',
]);

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  const routeKey = `${method} ${path}`;

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: {}, body: '' };
  }

  let body: unknown = {};
  try {
    body = parseRequestBody(event);
  } catch (err) {
    if (isAppError(err)) {
      return badRequest(err.message);
    }
    return badRequest('Invalid request body');
  }

  try {
    if (method === 'POST' && path === '/oauth/token') {
      return ok(await handleOAuthToken(body));
    }

    if (PROTECTED_ROUTES.has(routeKey)) {
      await requireAuth(event);
    }

    if (method === 'GET' && path === '/metadata') {
      return ok(await handleGetMetadata(client));
    }

    if (method === 'POST' && path === '/add') {
      return ok(await handleAdd(client, body));
    }

    if (method === 'POST' && path === '/reports/generate') {
      return ok(await handleGenerateReport(client, body));
    }

    if (method === 'POST' && path === '/reports/save') {
      return ok(await handleSaveReport(client, body));
    }

    if (method === 'POST' && path === '/reports/refresh') {
      return ok(await handleRefreshReport(client, body));
    }

    if (method === 'POST' && path === '/reports/recent') {
      return ok(await handleRecentReport(client, body));
    }

    return badRequest(`Unknown route: ${method} ${path}`);
  } catch (err) {
    console.error(err);

    if (isAppError(err)) {
      if (err.statusCode === 401) {
        return unauthorized(err.message);
      }
      if (err.statusCode === 409) {
        return conflict(err.message);
      }
      if (err.statusCode >= 500) {
        return serverError(err.message, err.retryable);
      }
      return badRequest(err.message);
    }

    return serverError('Internal server error');
  }
}

import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { GitLabClient } from './gitlab/client';
import { handleAdd } from './routes/add';
import { handleGetMetadata } from './routes/metadata';
import {
  handleGenerateReport,
  handleRefreshReport,
  handleSaveReport,
} from './routes/reports';
import { isAppError } from './util/errors';
import { badRequest, conflict, ok, serverError } from './util/response';

const client = new GitLabClient();

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: {}, body: '' };
  }

  let body: unknown = {};
  if (event.body) {
    try {
      body = JSON.parse(
        event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString('utf-8')
          : event.body,
      );
    } catch {
      return badRequest('Invalid JSON body');
    }
  }

  try {
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

    return badRequest(`Unknown route: ${method} ${path}`);
  } catch (err) {
    console.error(err);

    if (isAppError(err)) {
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

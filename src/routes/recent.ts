import type { GitLabClient } from '../gitlab/client';
import {
  computeRecentReport,
  validateRecentReportRequest,
} from '../domain/recent';

export async function handleRecentReport(client: GitLabClient, body: unknown) {
  const request = validateRecentReportRequest(body);
  return computeRecentReport(client, request);
}

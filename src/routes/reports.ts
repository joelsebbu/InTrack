import type { GitLabClient } from '../gitlab/client';
import { pathForReport } from '../gitlab/paths';
import {
  computeReport,
  validateReportRequest,
  validateSaveReportRequest,
} from '../domain/reports';
import type { Report } from '../types';

export async function handleGenerateReport(client: GitLabClient, body: unknown) {
  const request = validateReportRequest(body);
  const reportPath = pathForReport(request.type, request.year, request.month);
  const existing = await client.getFileJson<Report>(reportPath);

  if (existing) {
    return { source: 'file' as const, data: existing };
  }

  const computed = await computeReport(client, request);
  return { source: 'computed' as const, data: computed };
}

export async function handleRefreshReport(client: GitLabClient, body: unknown) {
  const request = validateReportRequest(body);
  const computed = await computeReport(client, request);
  return { source: 'computed' as const, data: computed };
}

export async function handleSaveReport(client: GitLabClient, body: unknown) {
  const request = validateSaveReportRequest(body);
  const reportPath = pathForReport(request.type, request.year, request.month);
  const exists = await client.fileExists(reportPath);

  const data: Report = {
    ...request.data,
    generatedAt: new Date().toISOString(),
  };

  const periodLabel =
    request.type === 'year'
      ? String(request.year)
      : `${request.year}-${String(request.month).padStart(2, '0')}`;

  const commit = await client.createCommit(`save report: ${periodLabel}`, [
    {
      action: exists ? 'update' : 'create',
      file_path: reportPath,
      content: JSON.stringify(data, null, 2) + '\n',
    },
  ]);

  return {
    ok: true,
    commitSha: commit.id,
    path: reportPath,
  };
}

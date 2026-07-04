import type {
  ExpenseEntry,
  Report,
  ReportType,
} from '../types';
import { AppError } from '../util/errors';
import { expensePrefixForReport, reportPeriod } from '../gitlab/paths';
import type { GitLabClient } from '../gitlab/client';

export interface ReportRequest {
  type: ReportType;
  year: number;
  month?: number;
}

export function validateReportRequest(body: unknown): ReportRequest {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object');
  }

  const data = body as Record<string, unknown>;
  const type = data.type;
  const year = data.year;
  const month = data.month;

  if (type !== 'month' && type !== 'year') {
    throw new AppError('type must be "month" or "year"');
  }
  if (typeof year !== 'number' || !Number.isInteger(year) || year < 2000) {
    throw new AppError('year must be a valid integer');
  }
  if (type === 'month') {
    if (typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError('month must be an integer between 1 and 12');
    }
    return { type, year, month };
  }

  if (month !== undefined) {
    throw new AppError('month must not be set for yearly reports');
  }

  return { type, year };
}

export function validateReportData(body: unknown): Report {
  if (!body || typeof body !== 'object') {
    throw new AppError('data must be a report object');
  }

  const data = body as Record<string, unknown>;
  const required = ['period', 'totalAmount', 'entryCount', 'byCategory', 'bySubcategory'];
  for (const key of required) {
    if (!(key in data)) {
      throw new AppError(`data.${key} is required`);
    }
  }

  return data as unknown as Report;
}

async function loadExpenseEntries(
  client: GitLabClient,
  prefix: string,
): Promise<ExpenseEntry[]> {
  const tree = await client.listTree(prefix, true);
  const jsonFiles = tree.filter(
    (item) => item.type === 'blob' && item.path.endsWith('.json'),
  );

  const entries: ExpenseEntry[] = [];
  for (const file of jsonFiles) {
    const dayEntries = await client.getFileJson<ExpenseEntry[]>(file.path);
    if (Array.isArray(dayEntries)) {
      entries.push(...dayEntries);
    }
  }

  return entries;
}

export function aggregateExpenses(
  entries: ExpenseEntry[],
  type: ReportType,
  year: number,
  month?: number,
): Report {
  const period = reportPeriod(type, year, month);
  return aggregateExpenseEntries(entries, period);
}

export function aggregateExpenseEntries(
  entries: ExpenseEntry[],
  period: string,
): Report {
  const byCategory: Report['byCategory'] = {};
  const bySubcategory: Report['bySubcategory'] = {};
  let totalAmount = 0;

  for (const entry of entries) {
    totalAmount += entry.amount;

    if (!byCategory[entry.category]) {
      byCategory[entry.category] = { amount: 0, count: 0 };
    }
    byCategory[entry.category].amount += entry.amount;
    byCategory[entry.category].count += 1;

    if (!bySubcategory[entry.subcategory]) {
      bySubcategory[entry.subcategory] = { amount: 0, count: 0 };
    }
    bySubcategory[entry.subcategory].amount += entry.amount;
    bySubcategory[entry.subcategory].count += 1;
  }

  return {
    period,
    totalAmount: roundMoney(totalAmount),
    entryCount: entries.length,
    byCategory: roundSummaries(byCategory),
    bySubcategory: roundSummaries(bySubcategory),
    generatedAt: new Date().toISOString(),
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundSummaries(
  summaries: Record<string, { amount: number; count: number }>,
): Record<string, { amount: number; count: number }> {
  const result: Record<string, { amount: number; count: number }> = {};
  for (const [key, value] of Object.entries(summaries)) {
    result[key] = {
      amount: roundMoney(value.amount),
      count: value.count,
    };
  }
  return result;
}

export async function computeReport(
  client: GitLabClient,
  request: ReportRequest,
): Promise<Report> {
  const prefix = expensePrefixForReport(request.type, request.year, request.month);
  const entries = await loadExpenseEntries(client, prefix);
  return aggregateExpenses(entries, request.type, request.year, request.month);
}

export interface SaveReportRequest extends ReportRequest {
  data: Report;
}

export function validateSaveReportRequest(body: unknown): SaveReportRequest {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object');
  }

  const data = body as Record<string, unknown>;
  const request = validateReportRequest(body);
  const reportData = validateReportData(data.data);

  return { ...request, data: reportData };
}

import type { GitLabClient } from '../gitlab/client';
import { pathForExpenseDate } from '../gitlab/paths';
import type { ExpenseEntry, Report } from '../types';
import {
  APP_TIME_ZONE,
  parseCalendarDateString,
  recentCalendarDates,
  todayInAppTimeZone,
} from '../util/dates';
import { AppError } from '../util/errors';
import { aggregateExpenseEntries } from './reports';

const MAX_RECENT_REPORT_DAYS = 90;

export interface RecentReportRequest {
  days: number;
  endDate?: string;
}

export interface RecentReportResponse {
  range: {
    days: number;
    from: string;
    to: string;
    timezone: string;
  };
  raw: Record<string, ExpenseEntry[]>;
  report: Report;
}

export function validateRecentReportRequest(body: unknown): RecentReportRequest {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object');
  }

  const data = body as Record<string, unknown>;
  const { days, endDate } = data;

  if (
    typeof days !== 'number' ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > MAX_RECENT_REPORT_DAYS
  ) {
    throw new AppError(`days must be an integer between 1 and ${MAX_RECENT_REPORT_DAYS}`);
  }

  if (endDate !== undefined) {
    if (typeof endDate !== 'string' || !parseCalendarDateString(endDate)) {
      throw new AppError('endDate must be a valid YYYY-MM-DD calendar date');
    }
    return { days, endDate };
  }

  return { days };
}

export async function computeRecentReport(
  client: GitLabClient,
  request: RecentReportRequest,
): Promise<RecentReportResponse> {
  const to = request.endDate ?? todayInAppTimeZone();
  const dates = recentCalendarDates(request.days, to);
  const entriesByDate = await Promise.all(
    dates.map(async (date) => {
      const entries = await client.getFileJson<ExpenseEntry[]>(pathForExpenseDate(date));
      return [date, Array.isArray(entries) ? entries : []] as const;
    }),
  );
  const raw = Object.fromEntries(entriesByDate);
  const entries = entriesByDate.flatMap(([, dayEntries]) => dayEntries);
  const from = dates[0];
  const report = aggregateExpenseEntries(entries, `${from}..${to}`);

  return {
    range: {
      days: request.days,
      from,
      to,
      timezone: APP_TIME_ZONE,
    },
    raw,
    report,
  };
}

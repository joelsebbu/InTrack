import type { ReportType } from '../types';
import { calendarDatePartsInAppTimeZone } from '../util/dates';

export function pathForExpense(timestamp: string | Date): string {
  const { year, month: monthNumber, day: dayNumber } =
    calendarDatePartsInAppTimeZone(timestamp);
  const month = String(monthNumber).padStart(2, '0');
  const day = String(dayNumber).padStart(2, '0');
  return `expenses/${year}/${month}/${day}.json`;
}

export function pathForReport(type: ReportType, year: number, month?: number): string {
  if (type === 'year') {
    return `reports/${year}/reports-${year}.json`;
  }
  if (month === undefined) {
    throw new Error('month is required for monthly reports');
  }
  const mm = String(month).padStart(2, '0');
  return `reports/${year}/${mm}/reports-${mm}.json`;
}

export function reportPeriod(type: ReportType, year: number, month?: number): string {
  if (type === 'year') {
    return String(year);
  }
  if (month === undefined) {
    throw new Error('month is required for monthly reports');
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function expensePrefixForReport(type: ReportType, year: number, month?: number): string {
  if (type === 'year') {
    return `expenses/${year}`;
  }
  if (month === undefined) {
    throw new Error('month is required for monthly reports');
  }
  const mm = String(month).padStart(2, '0');
  return `expenses/${year}/${mm}`;
}

export function reportPathsToInvalidate(timestamp: string | Date): string[] {
  const { year, month } = calendarDatePartsInAppTimeZone(timestamp);
  return [
    pathForReport('month', year, month),
    pathForReport('year', year),
  ];
}

export function makeExpenseId(timestamp: string): string {
  const ts = timestamp.replace(/[:.]/g, '-');
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${ts}-${suffix}`;
}

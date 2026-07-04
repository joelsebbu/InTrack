export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

export const APP_TIME_ZONE = 'Asia/Kolkata';

const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function calendarDatePartsInAppTimeZone(timestamp: string | Date): CalendarDateParts {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const parts = istDateFormatter.formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(valueByType.year),
    month: Number(valueByType.month),
    day: Number(valueByType.day),
  };
}

export function formatCalendarDateParts(parts: CalendarDateParts): string {
  return [
    String(parts.year),
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join('-');
}

export function todayInAppTimeZone(): string {
  return formatCalendarDateParts(calendarDatePartsInAppTimeZone(new Date()));
}

export function parseCalendarDateString(value: string): CalendarDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function addCalendarDays(dateString: string, days: number): string {
  const parts = parseCalendarDateString(dateString);
  if (!parts) {
    throw new Error('dateString must be YYYY-MM-DD');
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatCalendarDateParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function recentCalendarDates(days: number, endDate: string): string[] {
  return Array.from({ length: days }, (_, index) =>
    addCalendarDays(endDate, index - days + 1),
  );
}

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

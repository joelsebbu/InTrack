const APP_TIME_ZONE = 'Asia/Kolkata';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: APP_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
});

const monthYearFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: APP_TIME_ZONE,
  month: 'long',
  year: 'numeric',
});

export function formatISTDate(isoString) {
  return dateFormatter.format(new Date(isoString));
}

export function formatISTTime(isoString) {
  return timeFormatter.format(new Date(isoString));
}

export function formatISTMonthYear(year, month) {
  return monthYearFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function todayIST() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const map = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
  return `${map.year}-${map.month}-${map.day}`;
}

export function getISTNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export function toDatetimeLocalValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export function datetimeLocalToISO(value) {
  if (!value) return new Date().toISOString();
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - 5.5 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export function dayLabel(dateString) {
  const today = todayIST();
  const yesterday = addDays(today, -1);
  if (dateString === today) return 'Today';
  if (dateString === yesterday) return 'Yesterday';
  return dateFormatter.format(new Date(`${dateString}T12:00:00Z`));
}

function addDays(dateString, days) {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function formatRange(from, to) {
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);
  const fmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  });
  return `${fmt.format(fromDate)} – ${fmt.format(toDate)}`;
}

const DAY_MS = 86_400_000;

export function getVietnamDate(value: number | Date = Date.now()): string {
  return new Date(Number(value) + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function addCalendarDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

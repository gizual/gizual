// Contains helper functions for date and time manipulation.

const DAYS_MS_FACTOR = 1000 * 60 * 60 * 24;

export function getDateFromTimestamp(timestamp: string) {
  return new Date(Number(timestamp) * 1000);
}

export function getDayFromOffset(offset: number, startDate: Date) {
  const d = new Date(startDate.getTime() + offset * 1000 * 60 * 60 * 24);
  //console.log("getDayFromOffset", offset, startDate, "=", d);
  return d;
}

export function getDateString(date: Date) {
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function convertMsToDays(ms: number) {
  return ms / DAYS_MS_FACTOR;
}

export function convertDaysToMs(days: number) {
  return days * DAYS_MS_FACTOR;
}

export function getDaysBetween(start: Date, end: Date) {
  return Math.abs(convertMsToDays(start.getTime() - end.getTime()));
}

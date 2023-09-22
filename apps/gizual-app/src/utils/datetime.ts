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

export function getDayOnScale(start: Date, end: Date, width: number, offset: number) {
  const daysBetween = getDaysBetween(start, end);
  return new Date(start.getTime() + convertDaysToMs((daysBetween / width) * offset));
}

// Returns the date in the format "YYYY-MM-DD"
export function getStringDate(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Contains helper functions for date and time manipulation.

export const DATE_FORMAT = "YYYY-MM-DD";
export const DAYS_MS_FACTOR = 1000 * 60 * 60 * 24;

export function getDateFromTimestamp(timestamp: string) {
  return new Date(convertTimestampToMs(timestamp));
}

export function convertTimestampToMs(timestamp: string) {
  return Number(timestamp) * 1000;
}

export function getDayFromOffset(offset: number, startDate: Date) {
  const d = new Date(startDate.getTime() + offset * 1000 * 60 * 60 * 24);
  //console.log("getDayFromOffset", offset, startDate, "=", d);
  return d;
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

export function getDayForXCoord(start: Date, end: Date, width: number, offset: number) {
  const daysBetween = getDaysBetween(start, end);
  return new Date(start.getTime() + convertDaysToMs((daysBetween / width) * offset));
}

export function getXCoordsForDate(start: Date, end: Date, width: number, date: Date) {
  const daysBetween = getDaysBetween(start, end);
  const daysSinceStart = getDaysBetween(start, date);
  return Math.round((daysSinceStart / daysBetween) * width);
}

// Returns the date in the format "YYYY-MM-DD"
export function getStringDate(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function isDateBetween(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

export function discardTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

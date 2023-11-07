// Contains helper functions for date and time manipulation.

// Date format for `dayjs` for interoperability with `GizDate`.
// All displayed and parsed dates must be in this format, or stuff will inevitably break.
export const DATE_FORMAT = "YYYY/MM/DD";

export const DAYS_MS_FACTOR = 1000 * 60 * 60 * 24;

/**
 * Extends `Date` with a few utility functions, but otherwise behaves
 * completely identical to `Date`.
 */
export class GizDate extends Date {
  discardTimeComponent() {
    this.setHours(0, 0, 0, 0);
    return this;
  }

  /** Adds the specified number of `days` and returns a new date object. */
  addDays(days: number) {
    return new GizDate(this.getTime() + days * DAYS_MS_FACTOR);
  }

  /** Subtracts the specified number of `days` and returns a new date object. */
  subtractDays(days: number) {
    return this.addDays(-days);
  }

  toString() {
    return getStringDate(this);
  }

  toDateTimeString() {
    const hours = this.getHours().toString().padStart(2, "0");
    const minutes = this.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;

    return `${this.toString()} ${time}`;
  }

  isBetween(start: GizDate, end: GizDate) {
    return isDateBetween(this, start, end);
  }
}

export function getDateFromTimestamp(timestamp: string) {
  return new GizDate(convertTimestampToMs(timestamp));
}

export function convertTimestampToMs(timestamp: string) {
  return Number(timestamp) * 1000;
}

export function getDayFromOffset(offset: number, startDate: GizDate) {
  const d = new GizDate(startDate.getTime() + offset * 1000 * 60 * 60 * 24);
  //console.log("getDayFromOffset", offset, startDate, "=", d);
  return d;
}

export function convertMsToDays(ms: number) {
  return ms / DAYS_MS_FACTOR;
}

export function convertDaysToMs(days: number) {
  return days * DAYS_MS_FACTOR;
}

export function getDaysBetweenAbs(start: GizDate, end: GizDate) {
  return Math.abs(getDaysBetween(start, end));
}

export function getDaysBetween(start: GizDate, end: GizDate) {
  return convertMsToDays(end.getTime() - start.getTime());
}

export function estimateDayOnScale(start: GizDate, end: GizDate, width: number, offset: number) {
  const daysBetween = getDaysBetweenAbs(start, end);
  return new GizDate(start.getTime() + convertDaysToMs((daysBetween / width) * offset));
}

export function estimateCoordsOnScale(start: GizDate, end: GizDate, width: number, date: GizDate) {
  const daysBetween = getDaysBetweenAbs(start, end);
  const daysSinceStart = getDaysBetween(start, date);
  return Math.round((daysSinceStart / daysBetween) * width);
}

// Returns the date in the format "YYYY-MM-DD"
export function getStringDate(date: GizDate) {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}/${month}/${day}`;
}

export function isDateBetween(date: GizDate, start: GizDate, end: GizDate) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

import { GlobalLogState, LOG_LEVELS, LogLevel } from "./logging";

if (window === undefined) {
  throw new TypeError("Must be run in the main thread");
}

if (window.LOG) {
  throw new Error("Log state already configured");
}

const filterStr = localStorage.getItem("LOG_FILTER");
let filter: string[] | undefined;

if (filterStr) {
  filter = filterStr.split(",");
}

const maxLevelStr = localStorage.getItem("LOG_LEVEL");
let maxLevel: LogLevel | undefined;
if (maxLevelStr && LOG_LEVELS.includes(maxLevelStr as LogLevel)) {
  maxLevel = maxLevelStr as LogLevel;
}

window.LOG = new GlobalLogState({
  filter,
  maxLevel,
  onFilterStore: (filter) => {
    localStorage.setItem("LOG_FILTER", filter.join(","));
  },
  onLevelStore: (level) => {
    localStorage.setItem("LOG_LEVEL", level);
  },
  onReset: () => {
    localStorage.removeItem("LOG_FILTER");
    localStorage.removeItem("LOG_LEVEL");
  },
});

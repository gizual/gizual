import { GlobalLogState, LOG_LEVELS, LogLevel } from "./logging";

if (self === undefined) {
  throw new TypeError("Must be run in a worker");
}

if (self.LOG) {
  throw new Error("Logger already configured");
}

const url = new URL(self.location.href);

const name = url.searchParams.get("name");

const prefix = name ?? url.pathname.split("/").pop()?.split(".")[0] ?? "worker";

const filterStr = url.searchParams.get("logFilter");
let filter: string[] | undefined;

if (filterStr) {
  filter = filterStr.split(",");
}

const maxLevelStr = url.searchParams.get("logLevel");
let maxLevel: LogLevel | undefined;
if (maxLevelStr && LOG_LEVELS.includes(maxLevelStr as LogLevel)) {
  maxLevel = maxLevelStr as LogLevel;
}

const logChannelId = url.searchParams.get("logChannelId");
if (!logChannelId) {
  throw new Error("No log channel id, ensure you use @giz/worker to create the worker");
}

self.LOG = new GlobalLogState({
  prefix,
  filter,
  maxLevel,
  id: logChannelId,
});

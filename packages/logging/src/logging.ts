import { minimatch } from "minimatch";
export { serializeError } from "serialize-error";

declare global {
  interface Window {
    LOG: GlobalLogState;
  }
  interface WorkerGlobalScope {
    LOG: GlobalLogState;
  }
}

export const LOG_LEVELS = ["debug", "info", "log", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const getNumericLogLevel = (level: (typeof LOG_LEVELS)[number]) => {
  return LOG_LEVELS.indexOf(level);
};

const LOG_LEVEL_COLOR_MAPPING = {
  debug: "yellow",
  info: "lightblue",
  log: "green",
  warn: "orange",
  error: "red",
};

const NAMESPACE_COLOR = "grey";

type GlobalLogStateOpts = {
  maxLevel?: LogLevel;
  filter?: string[];
  prefix?: string;
  id?: string;
  onLevelStore?: (level: LogLevel) => void;
  onFilterStore?: (filter: string[]) => void;
  onReset?: () => void;
};

const DEFAULT_LOG_LEVEL: LogLevel = import.meta.env.DEV ? "info" : "warn";

export class GlobalLogState {
  id: string;
  maxLevel: LogLevel;
  refs: Logger[];
  filter: string[];
  cfgChannel: BroadcastChannel;
  prefix?: string;
  onLevelStore?: (level: LogLevel) => void;
  onFilterStore?: (filter: string[]) => void;
  onReset?: () => void;

  constructor(opts: GlobalLogStateOpts = {}) {
    this.onLevelStore = opts.onLevelStore;
    this.onFilterStore = opts.onFilterStore;
    this.onReset = opts.onReset;

    this.maxLevel = opts.maxLevel || DEFAULT_LOG_LEVEL;
    this.refs = [];
    this.filter = opts.filter ?? [];
    this.prefix = opts.prefix ?? "";
    this.id = opts.id || Math.random().toString(36).slice(2);
    const channelId = `log-config-${this.id}`;
    this.cfgChannel = new BroadcastChannel(channelId);
    this.cfgChannel.onmessage = this.receiveConfig.bind(this);
  }

  receiveConfig(ev: MessageEvent<GlobalLogStateOpts>) {
    this.maxLevel = ev.data.maxLevel ?? this.maxLevel;
    this.filter = ev.data.filter ?? this.filter;
    this.broadcast(false);
  }

  broadcast(echo = true) {
    for (const ref of this.refs) {
      populateLogger(ref, {
        name: ref.name,
        proxied: ref.proxied,
        maxLevel: this.maxLevel,
        filter: this.filter,
      });
    }
    if (echo) {
      this.cfgChannel.postMessage({ maxLevel: this.maxLevel, filter: this.filter });
    }
  }

  reset(store = true) {
    this.maxLevel = DEFAULT_LOG_LEVEL;
    this.filter = [];
    if (store) {
      this.onReset?.();
    }
    this.broadcast();

    return "Reset log state successfully!";
  }

  status() {
    return `Log level: "${this.maxLevel}";  Filter: [${this.filter.join(", ")}]`;
  }

  setLevel(level: LogLevel, store = true) {
    if (!LOG_LEVELS.includes(level)) {
      throw new Error("Invalid log level");
    }

    this.maxLevel = level;
    if (store) {
      this.onLevelStore?.(level);
    }
    this.broadcast();

    return `Set log level to "${level}"`;
  }

  setFilter(filter: string | string[] | undefined, store = true) {
    if (typeof filter === "string") {
      this.filter = [filter];
    } else if (Array.isArray(filter)) {
      this.filter = filter;
    } else if (filter === undefined) {
      this.filter = [];
    } else {
      throw new Error("Invalid filter");
    }
    if (store) {
      this.onFilterStore?.(this.filter);
    }

    this.broadcast();

    return `Set filter to [${this.filter.join(",")}]`;
  }

  registerLogger(logger: Logger) {
    this.refs.push(logger);
  }

  releaseLogger(logger: Logger) {
    const index = this.refs.indexOf(logger);
    if (index !== -1) {
      this.refs.splice(index, 1);
    }
  }
}

export type LogMessageContext = {
  namespace?: string;
  logLevel?: number;
};

export function getGlobalState() {
  if (typeof window !== "undefined" && window.LOG) {
    return window.LOG;
  }

  if (typeof self !== "undefined" && self.LOG) {
    return self.LOG;
  }
  throw new Error(
    "No root logger found, ensure you init the logging package in the entrypoint of your context (worker or window)",
  );
}

function createPrefix(level: LogLevel, name?: string, proxied?: boolean): string[] {
  let prefix = "";
  const format: string[] = [];
  if (proxied) {
    prefix += "%cPROXY%c ";
    format.push("color:white;background-color:gray", "color:inherit;background-color:inherit;");
  }

  prefix += `%c${level.toUpperCase()}%c`;
  format.push(`color:${LOG_LEVEL_COLOR_MAPPING[level]};`, `color:inherit;`);

  if (name) {
    prefix += `(%c${name}%c)`;
    format.push(`color:${NAMESPACE_COLOR};`, `color:inherit;`);
  }

  prefix += ":";

  return [prefix, ...format];
}

function createLogFunction(level: LogLevel, name?: string, proxied?: boolean) {
  const g = typeof window === "undefined" ? self : window;
  return g.console[level].bind(g.console, ...createPrefix(level, name, proxied));
}

type LogFuncs = Record<LogLevel, (...args: any[]) => void>;
export type Logger = LogFuncs & {
  name: string;
  proxied?: boolean;
  child: (name: string) => Logger;
  release: () => void;
};

type LogState = {
  name: string;
  maxLevel: LogLevel;
  filter: string[];
  proxied?: boolean;
};

function populateLogger(logger: Logger, ctx: LogState) {
  const maxLevel = ctx.maxLevel ?? "debug";
  const isVisible =
    ctx.filter.length === 0 || ctx.filter.some((pattern) => minimatch(ctx.name, pattern));

  for (const level of LOG_LEVELS) {
    if (!isVisible || getNumericLogLevel(level) < getNumericLogLevel(maxLevel)) {
      logger[level] = () => {};
    } else {
      logger[level] = createLogFunction(level, ctx.name, ctx.proxied);
    }
  }

  logger.name = ctx.name;
  logger.proxied = ctx.proxied;
}

export const createLogger = (name = "", opts?: LogState): Logger => {
  const logger = {} as Logger;
  const globalState = getGlobalState();
  const fullName = [globalState.prefix, name].filter(Boolean).join("::");

  populateLogger(logger, {
    name: fullName ?? "",
    maxLevel: globalState.maxLevel,
    filter: globalState.filter,
    ...opts,
  });

  globalState.registerLogger(logger);

  logger.release = () => {
    globalState.releaseLogger(logger);
  };

  logger.child = (childName: string) => {
    const newName = [name, childName].filter(Boolean).join(":");
    return createLogger(newName);
  };

  return logger;
};

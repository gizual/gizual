export type CloneStartEvent = {
  type: "clone-start";
  repoSlug: string;
};

export type CloneProgressEvent = {
  type: "clone-progress";
  repoSlug: string;
  state: "remote" | "receiving" | "resolving" | "done" | string;
  progress: number;
  numProcessed: number;
  numTotal: number;
};

export type CloneFailedEvent = {
  type: "clone-failed";
  repoSlug: string;
  error: string;
};

export type CloneCompleteEvent = {
  type: "clone-complete";
  repoSlug: string;
};

export type SnapshotCreatedEvent = {
  type: "snapshot-created";
  repoSlug: string;
  snapshotName: string;
};

export type Events = {
  "clone-start": CloneStartEvent;
  "clone-progress": CloneProgressEvent;
  "clone-failed": CloneFailedEvent;
  "clone-complete": CloneCompleteEvent;
  "snapshot-created": SnapshotCreatedEvent;
};

export type Event = Events[keyof Events];

export class EventService {
  private listeners: Record<string, ((event: Record<string, any>) => void)[]> = {};
  constructor() {}

  private _emit(name: string, event: Event) {
    for (const key in this.listeners) {
      if (new RegExp(key).test(name)) {
        this.listeners[key].forEach((listener) => listener(event));
      }
    }
  }

  private _on(name: string | RegExp, listener: (event: any) => void) {
    const key = name instanceof RegExp ? name.source : name;
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(listener);
  }

  private _off(name: string | RegExp, listener: (event: any) => void) {
    const key = name instanceof RegExp ? name.source : name;
    if (this.listeners[key]) {
      const index = this.listeners[key].indexOf(listener);
      if (index !== -1) {
        this.listeners[key].splice(index, 1);
      }
    }
  }

  emit(event: Event) {
    const eventName = `${event.type}(${event.repoSlug})`;
    //console.log(`event:${eventName}:`, JSON.stringify(omit(event, "type", "repoSlug")));
    this._emit(eventName, event);
  }

  on<K extends keyof Events, E extends Events[K]>(
    eventType: K,
    repoSlug: string,
    listener: (event: E) => void,
  ) {
    const eventName = `${eventType}(${repoSlug})`;
    return this._on(eventName, listener);
  }

  onAny(repoSlug: string, listener: (event: Event) => void) {
    const key = new RegExp(`^.+\\(${repoSlug}\\)$`);
    return this._on(key, listener);
  }

  off<K extends keyof Events, E extends Events[K]>(
    eventType: K,
    repoSlug: string,
    listener: (event: E) => void,
  ) {
    const eventName = `${eventType}(${repoSlug})`;
    return this._off(eventName, listener);
  }

  offAny(repoSlug: string, listener: (event: Event) => void) {
    const key = new RegExp(`^.+\\(${repoSlug}\\)$`);
    return this._off(key, listener);
  }
}
function omit(event: Record<string, any>, ...args: string[]): Record<string, any> {
  const copy = { ...event };
  for (const arg of args) {
    delete copy[arg];
  }
  return copy;
}

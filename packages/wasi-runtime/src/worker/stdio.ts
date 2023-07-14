export const EOF = Symbol("EOF");
type EOF = typeof EOF;
type InternalCallback = (data: string | EOF) => boolean;
type Callback = (data: string | EOF) => void;

export class StdoutPipe {
  private data = "";
  private listener: ((data: string) => void) | undefined = undefined;

  constructor(public identifier: string = "") {}

  log(...args: any[]) {
    console.log(`${this.identifier}:`, ...args);
  }
  public readBytes(numBytes: number): Promise<string> {
    this.log("readBytes", numBytes);
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      while (this.data.length === 0) {
        this.log("waiting for data");
        await new Promise<void>((innerResolve) => {
          const listener = () => {
            this.removeListener(listener);
            innerResolve();
          };
          this.addListener(listener);
          this.log("skipped");
        });
      }

      const bytes = this.data.slice(0, Math.max(0, numBytes));
      this.data = this.data.slice(Math.max(0, bytes.length));
      resolve(bytes);
    });
  }

  public readLine(): Promise<string> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      while (!this.data.includes("\n")) {
        await new Promise<void>((innerResolve) => {
          const listener = () => {
            this.removeListener(listener);
            innerResolve();
          };
          this.addListener(listener);
        });
      }

      const newlineIndex = this.data.indexOf("\n");
      const line = this.data.slice(0, Math.max(0, newlineIndex));
      this.data = this.data.slice(Math.max(0, newlineIndex + 1));
      resolve(line);
    });
  }

  public write(data: string): void {
    this.data += data;
    if (this.listener !== undefined) {
      this.listener(data);
    }
  }

  public addListener(listener: (data: string) => void): void {
    if (this.listener !== undefined) {
      throw new Error("Only one listener on stdout is supported");
    }
    this.listener = listener;
  }

  public removeListener(listener: (data: string) => void): void {
    if (this.listener !== listener) {
      throw new Error("Listener to delete not found");
    }
    this.listener = undefined;
  }
}

export class StdInPipe {
  cache: string;
  isEOF: boolean;

  callbacks: InternalCallback[];

  constructor() {
    this.cache = "";
    this.isEOF = false;
    this.callbacks = [];
  }

  read(numBytes: number): Promise<string | EOF> {
    const promise = new Promise<string | EOF>((resolve) => {
      if (this.isEOF) {
        resolve(EOF);
        return;
      }
      this.registerCallback(numBytes, resolve);
    });
    this.handleCallbacks();
    return promise;
  }

  registerCallback(numBytes: number, cb: Callback) {
    this.callbacks.push((data) => {
      if (data === EOF) {
        if (this.cache.length > 0) {
          cb(this.cache);
          return true;
        }
        cb(EOF);
        return true;
      }
      if (data.length >= numBytes) {
        cb(data.slice(0, numBytes));
        return true;
      }
      return false;
    });
  }

  handleCallbacks() {
    const newCallbacks: InternalCallback[] = [];
    for (const cb of this.callbacks) {
      if (!cb(this.cache)) {
        newCallbacks.push(cb);
      }
    }
    this.callbacks = newCallbacks;
  }

  write(data: string) {
    this.cache += data;
    this.handleCallbacks();
  }

  close() {
    this.isEOF = true;
    this.handleCallbacks();
  }
}

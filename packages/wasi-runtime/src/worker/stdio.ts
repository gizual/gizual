import { LOG, Logger } from "@giz/logger";

export const EOF = Symbol("EOF");
type EOF = typeof EOF;
type InternalCallback = (data: string | EOF) => boolean;
type Callback = (data: string | EOF) => void;

export class StdIoPipe {
  private data = "";
  private listener: ((data: string) => void) | undefined = undefined;
  private logger: Logger;

  constructor(public identifier: string = "", parentLogger?: Logger) {
    this.logger = (parentLogger ?? LOG).getSubLogger({ name: identifier });
  }

  public readBytes(numBytes: number): Promise<string> {
    this.logger.trace("readBytes", numBytes);
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      while (this.data.length === 0) {
        this.logger.trace("waiting for data");
        await new Promise<void>((innerResolve) => {
          const listener = () => {
            this.removeListener(listener);
            innerResolve();
          };
          this.addListener(listener);
        });
      }
      this.logger.trace("got data", this.data.length);

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

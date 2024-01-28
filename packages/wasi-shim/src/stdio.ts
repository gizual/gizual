import { Fd, RetVal_nread, RetVal_nwritten } from "./file-descriptor";
import { Iovec } from "./wasi-defs";

export class ConsolePipe extends Fd {
  cache = "";
  constructor(public prefix: string = "") {
    super();
  }

  fd_write(view8: Uint8Array, iovs: Iovec[]): RetVal_nwritten {
    let nwritten = 0;
    let output = "";
    for (const iovec of iovs) {
      const part = iovec.to_string(view8.buffer);
      output += part;
      nwritten += part.length;
    }

    this.cache += output;

    if (this.cache.endsWith("\n")) {
      output = this.cache.slice(0, -1);
      this.cache = "";
      console.log(`${this.prefix}:` + output);
    }

    return { ret: 0, nwritten };
  }
}

export class StdIoPipe extends Fd {
  private allData = "";
  private data = "";
  private listener: ((data: string) => void) | undefined = undefined;

  constructor(public identifier: string = "") {
    super();
  }

  public readBytes(numBytes: number): Promise<string> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      while (this.data.length === 0) {
        await new Promise<void>((innerResolve) => {
          const listener = () => {
            this.removeListener(listener);
            innerResolve();
          };
          this.addListener(listener);
        });
      }

      const bytes = this.data.slice(0, Math.max(0, numBytes));
      this.data = this.data.slice(Math.max(0, bytes.length));
      resolve(bytes);
    });
  }

  public getAllData(): string {
    return this.allData;
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
    this.allData += data;
    this.data += data;
    if (this.listener !== undefined) {
      this.listener(data);
    }
  }

  async fd_read(view8: Uint8Array, iovs: Iovec[]): Promise<RetVal_nread> {
    let nread = 0;
    for (const iovec of iovs) {
      const data = await this.readBytes(iovec.buf_len);
      iovec.set_string(view8.buffer, data);
      nread += data.length;
    }
    return { ret: 0, nread };
  }

  fd_write(view8: Uint8Array, iovs: Iovec[]): RetVal_nwritten {
    let nwritten = 0;
    let output = "";
    for (const iovec of iovs) {
      const part = iovec.to_string(view8.buffer);
      output += part;
      nwritten += iovec.buf_len;
    }
    this.write(output);

    return { ret: 0, nwritten };
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

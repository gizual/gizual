import * as Asyncify from "@xtuc/asyncify-wasm";

import { Fd } from "./file-descriptor";
import { Filesystem } from "./filesystem";
import { ConsolePipe, StdIoPipe } from "./stdio";
import { trace } from "./trace";
import * as wasi from "./wasi-defs.js";

export class WasiExitError extends Error {
  constructor(public exitCode: number) {
    super(`WASI exited with code ${exitCode}`);
  }
}

export type WasiCreateOpts = {
  args?: Array<string>;
  env?: Array<string>;
  fs?: Fd | Fd[];
  trace?: boolean;
};

export class WASI {
  args: Array<string> = [];
  env: Array<string> = [];
  inst!: { exports: { memory: WebAssembly.Memory; _start: () => Promise<void> } };
  fs: Filesystem;
  exitCode = 0;

  onExit: ((exitCode: number) => void) | undefined = undefined;

  /// Start a WASI command
  run(): Promise<number> {
    this.fs.registerMemory(this.inst.exports.memory);

    return this.inst.exports
      ._start()
      .then(() => {
        return 0;
      })
      .catch((error: Error) => {
        if (error instanceof WasiExitError) {
          return error.exitCode;
        } else {
          throw error;
        }
      });
  }

  constructor(
    args: Array<string>,
    env: Array<string>,
    fs: Fd | Fd[],
    public trace?: boolean,
  ) {
    this.args = ["", ...args]; // first arg is the path to the executable by convention
    this.env = env;

    this.fs = new Filesystem(
      new StdIoPipe(),
      new StdIoPipe(),
      new ConsolePipe("stderr"),
      Array.isArray(fs) ? fs : [fs],
    );
  }

  readStdoutLine(): Promise<string> {
    return this.fs.stdout.readLine();
  }

  readAllStdout(): string {
    return this.fs.stdout.getAllData();
  }

  writeStdin(data: string): void {
    this.fs.stdin.write(data);
  }

  async instantiate(input: WebAssembly.Module | URL | Uint8Array) {
    let data: BufferSource;
    if (input instanceof URL) {
      data = await fetch(input).then((res) => res.arrayBuffer());
    }
    if (typeof input === "string") {
      data = await fetch(new URL(input, import.meta.url)).then((res) => res.arrayBuffer());
    } else if (input instanceof Uint8Array) {
      data = input.buffer;
    }

    if (data) {
      input = await WebAssembly.compile(data);
    }

    if (!input) {
      throw new Error("Unable to compile wasm module");
    }

    this.inst = (await Asyncify.instantiate(input, {
      wasi_snapshot_preview1: this.wasiImports,
    })) as any;
  }

  static async create(input: WebAssembly.Module | URL | Uint8Array, opts: WasiCreateOpts) {
    const args = opts.args || [];
    const env = opts.env || [];
    const fd = opts.fs || new Fd();

    const wasi = new WASI(args, env, fd);
    await wasi.instantiate(input);
    return wasi;
  }

  get wasiImports() {
    const self = this;

    const imports = {
      ...self.fs.wasiImports,
      args_sizes_get(argc: number, argv_buf_size: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        buffer.setUint32(argc, self.args.length, true);
        let buf_size = 0;
        for (const arg of self.args) {
          buf_size += arg.length + 1;
        }
        buffer.setUint32(argv_buf_size, buf_size, true);
        //console.log(buffer.getUint32(argc, true), buffer.getUint32(argv_buf_size, true));
        return 0;
      },
      args_get(argv: number, argv_buf: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const orig_argv_buf = argv_buf;
        for (let i = 0; i < self.args.length; i++) {
          buffer.setUint32(argv, argv_buf, true);
          argv += 4;
          const arg = new TextEncoder().encode(self.args[i]);
          buffer8.set(arg, argv_buf);
          buffer.setUint8(argv_buf + arg.length, 0);
          argv_buf += arg.length + 1;
        }
        //console.log(new TextDecoder("utf-8").decode(buffer8.slice(orig_argv_buf, argv_buf)));
        return 0;
      },

      environ_sizes_get(environ_count: number, environ_size: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        buffer.setUint32(environ_count, self.env.length, true);
        let buf_size = 0;
        for (const environ of self.env) {
          buf_size += environ.length + 1;
        }
        buffer.setUint32(environ_size, buf_size, true);
        //console.log(buffer.getUint32(environ_count, true), buffer.getUint32(environ_size, true));
        return 0;
      },
      environ_get(environ: number, environ_buf: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const orig_environ_buf = environ_buf;
        for (const element of self.env) {
          buffer.setUint32(environ, environ_buf, true);
          environ += 4;
          const e = new TextEncoder().encode(element);
          buffer8.set(e, environ_buf);
          buffer.setUint8(environ_buf + e.length, 0);
          environ_buf += e.length + 1;
        }
        //console.log(new TextDecoder("utf-8").decode(buffer8.slice(orig_environ_buf, environ_buf)));
        return 0;
      },

      clock_res_get(id: number, res_ptr: number): number {
        throw "unimplemented";
      },
      clock_time_get(id: number, precision: bigint, time: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        if (id === wasi.CLOCKID_REALTIME) {
          buffer.setBigUint64(time, BigInt(Date.now()) * 1_000_000n, true);
        } else if (id == wasi.CLOCKID_MONOTONIC) {
          let monotonic_time: bigint;
          try {
            monotonic_time = BigInt(Math.round(performance.now() * 1_000_000));
          } catch {
            // performance.now() is only available in browsers.
            // TODO use the perf_hooks builtin module for NodeJS
            monotonic_time = 0n;
          }
          buffer.setBigUint64(time, monotonic_time, true);
        } else {
          // TODO
          buffer.setBigUint64(time, 0n, true);
        }
        return 0;
      },
      poll_oneoff(in_: number, out: number, nsubscriptions: number) {
        throw "async io not supported";
      },
      proc_exit(exit_code: number) {
        if (self.onExit) {
          self.onExit(exit_code);
        }
        self.exitCode = exit_code;
        throw new WasiExitError(exit_code);
      },
      proc_raise(sig: number) {
        throw "raised signal " + sig;
      },
      sched_yield() {},
      random_get(buf: number, buf_len: number) {
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        for (let i = 0; i < buf_len; i++) {
          buffer8[buf + i] = Math.trunc(Math.random() * 256);
        }
      },
      sock_recv(fd: number, ri_data: number, ri_flags: number) {
        throw "sockets not supported";
      },
      sock_send(fd: number, si_data: number, si_flags: number) {
        throw "sockets not supported";
      },
      sock_shutdown(fd: number, ho: number) {
        throw "sockets not supported";
      },
      sock_accept(fd: number, flags: number) {
        throw "sockets not supported";
      },
    };

    if (this.trace) {
      return trace(imports);
    }

    return imports;
  }
}

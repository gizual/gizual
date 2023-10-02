import * as Asyncify from "@xtuc/asyncify-wasm";

import { Fd, RetVal_dirent, RetVal_fd_obj, RetVal_filestat, RetVal_nread } from "./file-descriptor";
import { ConsolePipe, StdIoPipe } from "./stdio";
import { trace } from "./trace";
import { isPromise } from "./utils";
import * as wasi from "./wasi-defs.js";

export type ReadDirContext = {
  buf: number;
  buf_len: number;
  bufused: number;
  bufused_ptr: number;
  cookie: bigint;
  buffer: DataView;
  buffer8: Uint8Array;
  break?: boolean;
  ret?: number;
};

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
  stdin: StdIoPipe;
  stdout: StdIoPipe;
  stderr: Fd;

  args: Array<string> = [];
  env: Array<string> = [];
  inst!: { exports: { memory: WebAssembly.Memory; _start: () => Promise<void> } };
  exitCode = 0;

  private fdMap: Map<number, Fd> = new Map();

  /// Start a WASI command
  run(): Promise<number> {
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

    this.setupFS(fs);
  }

  get memory() {
    return this.inst.exports.memory;
  }

  readStdoutLine(): Promise<string> {
    return this.stdout.readLine();
  }

  readAllStdout(): string {
    return this.stdout.getAllData();
  }

  writeStdin(data: string): void {
    this.stdin.write(data);
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

  setupFS(preopenDirs: Fd | Fd[]) {
    this.stdin = new StdIoPipe();
    this.stdout = new StdIoPipe();
    this.stderr = new ConsolePipe("stderr");

    this.fdMap.set(wasi.FD_STDIN, this.stdin);
    this.fdMap.set(wasi.FD_STDOUT, this.stdout);
    this.fdMap.set(wasi.FD_STDERR, this.stderr);

    const dirs = Array.isArray(preopenDirs) ? preopenDirs : [preopenDirs];

    for (const fd of dirs) {
      this.fdMap.set(this.getNextFd(), fd);
    }
  }

  static async create(input: WebAssembly.Module | URL | Uint8Array, opts: WasiCreateOpts) {
    const args = opts.args || [];
    const env = opts.env || [];
    const fd = opts.fs || new Fd();

    const wasi = new WASI(args, env, fd, opts.trace);
    await wasi.instantiate(input);

    return wasi;
  }

  private hasFd(fd: number): boolean {
    return this.fdMap.has(fd);
  }

  private getFd(fd: number): Fd {
    return this.fdMap.get(fd)!;
  }

  private getNextFd(): number {
    let fd = 3;
    while (this.hasFd(fd)) {
      fd++;
    }
    return fd;
  }

  private process_readdir({ ret, dirent }: RetVal_dirent, ctx: ReadDirContext) {
    if (ret != 0) {
      ctx.buffer.setUint32(ctx.bufused_ptr, ctx.bufused, true);
      ctx.ret = ret;
      return ctx;
    }
    if (dirent == null) {
      ctx.break = true;
      return ctx;
    }

    if (ctx.buf_len - ctx.bufused < dirent.head_length()) {
      ctx.bufused = ctx.buf_len;
      ctx.break = true;
      return ctx;
    }

    const head_bytes = new ArrayBuffer(dirent.head_length());
    dirent.write_head_bytes(new DataView(head_bytes), 0);
    ctx.buffer8.set(
      new Uint8Array(head_bytes).slice(
        0,
        Math.min(head_bytes.byteLength, ctx.buf_len - ctx.bufused),
      ),
      ctx.buf,
    );
    ctx.buf += dirent.head_length();
    ctx.bufused += dirent.head_length();

    if (ctx.buf_len - ctx.bufused < dirent.name_length()) {
      ctx.bufused = ctx.buf_len;
      ctx.break = true;
      return ctx;
    }

    dirent.write_name_bytes(ctx.buffer8, ctx.buf, ctx.buf_len - ctx.bufused);
    ctx.buf += dirent.name_length();
    ctx.bufused += dirent.name_length();

    ctx.cookie = dirent.d_next;

    return ctx;
  }

  get wasiImports() {
    const self = this;

    async function fd_readdir_async(fd: number, ctx: ReadDirContext): Promise<number> {
      if (!self.hasFd(fd)) {
        return wasi.ERRNO_BADF;
      }
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await self.getFd(fd).fd_readdir_single(ctx.cookie);

        ctx = self.process_readdir(result, ctx);
        if (ctx.break) {
          break;
        }

        if (ctx.ret != undefined) {
          return ctx.ret;
        }
      }

      ctx.buffer.setUint32(ctx.bufused_ptr, ctx.bufused, true);

      return 0;
    }
    const imports = {
      args_sizes_get(argc: number, argv_buf_size: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        buffer.setUint32(argc, self.args.length, true);
        let buf_size = 0;
        for (const arg of self.args) {
          buf_size += arg.length + 1;
        }
        buffer.setUint32(argv_buf_size, buf_size, true);
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
            monotonic_time = 0n;
          }
          buffer.setBigUint64(time, monotonic_time, true);
        } else {
          buffer.setBigUint64(time, 0n, true);
        }
        return 0;
      },
      poll_oneoff(in_: number, out: number, nsubscriptions: number) {
        throw "async io not supported";
      },
      proc_exit(exit_code: number) {
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

      fd_close: (fd: number) => {
        const file = this.fdMap.get(fd);
        if (!file) return wasi.ERRNO_BADF;
        self.fdMap.delete(fd);
        return file.fd_close();
      },
      fd_filestat_get(fd: number, filestat_ptr: number): number {
        if (self.hasFd(fd)) {
          const { ret, filestat } = self.getFd(fd)!.fd_filestat_get();
          if (filestat != null) {
            filestat.write_bytes(new DataView(self.memory.buffer), filestat_ptr);
          }
          return ret;
        }
        return wasi.ERRNO_BADF;
      },

      fd_fdstat_get(fd: number, fdstat_ptr: number): number {
        if (self.hasFd(fd)) {
          const { ret, fdstat } = self.getFd(fd)!.fd_fdstat_get();
          if (fdstat != null) {
            fdstat.write_bytes(new DataView(self.memory.buffer), fdstat_ptr);
          }
          return ret;
        }
        return wasi.ERRNO_SUCCESS;
      },
      fd_fdstat_set_flags(fd: number, fdstat_ptr: number): number {
        console.error("fd_fdstat_set not implemented");
        return wasi.ERRNO_BADF;
      },
      fd_prestat_get(fd: number, prestat_ptr: number): number {
        if (self.hasFd(fd)) {
          const { ret, prestat } = self.getFd(fd)!.fd_prestat_get();
          if (prestat != null) {
            prestat.write_bytes(new DataView(self.memory.buffer), prestat_ptr);
          }
          return ret;
        }
        return wasi.ERRNO_BADF;
      },

      fd_prestat_dir_name(fd: number, path_ptr: number, path_len: number): number {
        if (self.hasFd(fd)) {
          const { ret, prestat_dir_name } = self.getFd(fd)!.fd_prestat_dir_name(path_ptr, path_len);
          if (prestat_dir_name != null) {
            const path = new Uint8Array(self.memory.buffer, path_ptr, path_len);
            path.set(new TextEncoder().encode(prestat_dir_name));
          }
          return ret;
        }
        return wasi.ERRNO_BADF;
      },

      fd_read(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        nread_ptr: number,
      ): Promise<number> | number {
        const buffer = new DataView(self.memory.buffer);
        const buffer8 = new Uint8Array(self.memory.buffer);
        if (self.hasFd(fd)) {
          const iovecs = wasi.Iovec.from_bytes_array(buffer, iovs_ptr, iovs_len);

          const finish = (data: RetVal_nread) => {
            buffer.setUint32(nread_ptr, data.nread, true);
            return data.ret;
          };

          const result = self.getFd(fd).fd_read(buffer8, iovecs);

          if (isPromise(result)) {
            return result.then(finish);
          }
          return finish(result);
        }
        return wasi.ERRNO_BADF;
      },
      fd_pread(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        offset: bigint,
        nread_ptr: number,
      ): number {
        const buffer = new DataView(self.memory.buffer);
        const buffer8 = new Uint8Array(self.memory.buffer);
        if (self.hasFd(fd)) {
          const iovecs = wasi.Iovec.from_bytes_array(buffer, iovs_ptr, iovs_len);
          const { ret, nread } = self.getFd(fd).fd_pread(buffer8, iovecs, offset);
          buffer.setUint32(nread_ptr, nread, true);
          return ret;
        }
        return wasi.ERRNO_BADF;
      },
      fd_write(fd: number, iovs_ptr: number, iovs_len: number, nwritten_ptr: number): number {
        const buffer = new DataView(self.memory.buffer);
        const buffer8 = new Uint8Array(self.memory.buffer);
        if (self.hasFd(fd)) {
          const iovecs = wasi.Iovec.from_bytes_array(buffer, iovs_ptr, iovs_len);
          const { ret, nwritten } = self.getFd(fd).fd_write(buffer8, iovecs);
          buffer.setUint32(nwritten_ptr, nwritten, true);
          return ret;
        }
        return wasi.ERRNO_BADF;
      },
      fd_pwrite(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        offset: bigint,
        nwritten_ptr: number,
      ): number {
        const buffer = new DataView(self.memory.buffer);
        const buffer8 = new Uint8Array(self.memory.buffer);
        if (self.hasFd(fd)) {
          const iovecs = wasi.Iovec.from_bytes_array(buffer, iovs_ptr, iovs_len);
          const { ret, nwritten } = self.getFd(fd).fd_pwrite(buffer8, iovecs, offset);
          buffer.setUint32(nwritten_ptr, nwritten, true);
          return ret;
        }
        return wasi.ERRNO_BADF;
      },

      fd_advise(fd: number, offset: bigint, len: bigint, advice: number): number {
        return self.hasFd(fd) == undefined
          ? wasi.ERRNO_BADF
          : self.getFd(fd).fd_advise(offset, len, advice);
      },

      path_open(
        fd: number,
        dirflags: number,
        path_ptr: number,
        path_len: number,
        oflags: number,
        fs_rights_base: bigint,
        fs_rights_inheriting: bigint,
        fd_flags: number,
        fd_out_ptr: number,
      ): number | Promise<number> {
        const buffer = new DataView(self.memory.buffer);
        const path = new Uint8Array(self.memory.buffer, path_ptr, path_len);
        if (self.hasFd(fd)) {
          const pathStr = new TextDecoder().decode(path);

          const result = self
            .getFd(fd)
            .path_open(dirflags, pathStr, oflags, fs_rights_base, fs_rights_inheriting, fd_flags);

          const finish = (data: RetVal_fd_obj) => {
            if (data.fd_obj != null) {
              const fd = self.getNextFd();
              self.fdMap.set(fd, data.fd_obj);
              buffer.setUint32(fd_out_ptr, fd, true);
            }
            return data.ret;
          };

          if (isPromise(result)) {
            return result.then(finish);
          }

          return finish(result);
        }
        return wasi.ERRNO_BADF;
      },

      path_filestat_get(
        fd: number,
        flags: number,
        path_ptr: number,
        path_len: number,
        filestat_ptr: number,
      ): Promise<number> | number {
        const buffer = new DataView(self.memory.buffer);
        if (self.hasFd(fd)) {
          const path = new Uint8Array(self.memory.buffer, path_ptr, path_len);
          const pathStr = new TextDecoder().decode(path);

          const result = self.getFd(fd).path_filestat_get(flags, pathStr);

          const finish = (data: RetVal_filestat) => {
            if (data.filestat != null) {
              data.filestat.write_bytes(buffer, filestat_ptr);
            }
            return data.ret;
          };

          if (isPromise(result)) {
            return result.then(finish);
          }
          return finish(result);
        }
        return wasi.ERRNO_BADF;
      },
      fd_readdir(
        fd: number,
        buf: number,
        buf_len: number,
        cookie: bigint,
        bufused_ptr: number,
      ): number | Promise<number> {
        if (!self.hasFd(fd)) {
          return wasi.ERRNO_BADF;
        }

        let ctx: ReadDirContext = {
          buf,
          buf_len,
          bufused: 0,
          bufused_ptr,
          cookie,
          buffer: new DataView(self.memory.buffer),
          buffer8: new Uint8Array(self.memory.buffer),
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const result = self.getFd(fd).fd_readdir_single(ctx.cookie);
          if (isPromise(result)) {
            return fd_readdir_async(fd, ctx);
          }

          ctx = self.process_readdir(result, ctx);
          if (ctx.break) {
            break;
          }

          if (ctx.ret != undefined) {
            return ctx.ret;
          }
        }

        ctx.buffer.setUint32(ctx.bufused_ptr, ctx.bufused, true);

        return 0;
      },

      fd_seek(fd: number, offset: bigint, whence: number, newoffset_ptr: number): number {
        return -1;
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

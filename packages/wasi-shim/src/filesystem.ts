import { Fd, RetVal_dirent, RetVal_fd_obj, RetVal_filestat, RetVal_nread } from "./file-descriptor";
import { StdIoPipe } from "./stdio";
import { isPromise } from "./utils";
import * as wasi from "./wasi-defs";

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

export class Filesystem {
  private memory!: WebAssembly.Memory;

  private fdMap: Map<number, Fd> = new Map();

  constructor(
    public stdin: StdIoPipe,
    public stdout: StdIoPipe,
    public stderr: Fd,
    preopenDirs: Array<Fd> = [],
  ) {
    this.fdMap.set(0, stdin);
    this.fdMap.set(1, stdout);
    this.fdMap.set(2, stderr);

    for (const fd of preopenDirs) {
      this.fdMap.set(this.getNextFd(), fd);
    }
  }

  registerMemory(memory: WebAssembly.Memory) {
    this.memory = memory;
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
    // eslint-disable-next-line unicorn/no-this-assignment
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

    return {
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
    };
  }
}

import { Fd } from "../file-descriptor";
import * as wasi from "../wasi-defs";

export class MemoryFile {
  data: Uint8Array;
  readonly: boolean;

  constructor(
    data?: ArrayBuffer | SharedArrayBuffer | Uint8Array | Array<number> | string,
    options?: { readonly?: boolean },
  ) {
    if (data == undefined) data = new ArrayBuffer(0);

    this.data =
      typeof data === "string"
        ? new Uint8Array(new TextEncoder().encode(data))
        : new Uint8Array(data);

    this.readonly = !!options?.readonly;
  }

  open(fd_flags: number): MemoryOpenFile {
    const file = new MemoryOpenFile(this);
    if (fd_flags & wasi.FDFLAGS_APPEND) file.fd_seek(0n, wasi.WHENCE_END);
    return file;
  }

  size(): bigint {
    return BigInt(this.data.byteLength);
  }

  stat(): wasi.Filestat {
    return new wasi.Filestat(wasi.FILETYPE_REGULAR_FILE, this.size());
  }

  truncate(): number {
    if (this.readonly) return wasi.ERRNO_PERM;
    this.data = new Uint8Array([]);
    return wasi.ERRNO_SUCCESS;
  }

  toJSON() {
    return {
      data: new Uint8Array(this.data),
      readonly: this.readonly,
    };
  }
}

export class MemoryOpenFile extends Fd {
  file: MemoryFile;
  filePos = 0n;

  constructor(file: MemoryFile) {
    super();
    this.file = file;
  }

  fd_fdstat_get(): { ret: number; fdstat: wasi.Fdstat | null } {
    return { ret: 0, fdstat: new wasi.Fdstat(wasi.FILETYPE_REGULAR_FILE, 0) };
  }

  fd_read(view8: Uint8Array, iovs: Array<wasi.Iovec>): { ret: number; nread: number } {
    let nread = 0;
    for (const iovec of iovs) {
      if (this.filePos < this.file.data.byteLength) {
        const slice = this.file.data.slice(
          Number(this.filePos),

          Number(this.filePos + BigInt(iovec.buf_len)),
        );
        view8.set(slice, iovec.buf);

        this.filePos += BigInt(slice.length);
        nread += slice.length;
      } else {
        break;
      }
    }
    return { ret: 0, nread };
  }

  fd_seek(offset: bigint, whence: number): { ret: number; offset: bigint } {
    let calculated_offset: bigint;
    switch (whence) {
      case wasi.WHENCE_SET: {
        calculated_offset = offset;
        break;
      }
      case wasi.WHENCE_CUR: {
        calculated_offset = this.filePos + offset;
        break;
      }
      case wasi.WHENCE_END: {
        calculated_offset = BigInt(this.file.data.byteLength) + offset;
        break;
      }
      default: {
        return { ret: wasi.ERRNO_INVAL, offset: 0n };
      }
    }

    if (calculated_offset < 0) {
      return { ret: wasi.ERRNO_INVAL, offset: 0n };
    }

    this.filePos = calculated_offset;
    return { ret: 0, offset: this.filePos };
  }

  fd_write(view8: Uint8Array, iovs: Array<wasi.Iovec>): { ret: number; nwritten: number } {
    let nwritten = 0;
    if (this.file.readonly) return { ret: wasi.ERRNO_BADF, nwritten };
    for (const iovec of iovs) {
      const buffer = view8.slice(iovec.buf, iovec.buf + iovec.buf_len);
      if (this.filePos + BigInt(buffer.byteLength) > this.file.size()) {
        const old = this.file.data;
        this.file.data = new Uint8Array(Number(this.filePos + BigInt(buffer.byteLength)));
        this.file.data.set(old);
      }
      this.file.data.set(
        buffer.slice(0, Number(this.file.size() - this.filePos)),
        Number(this.filePos),
      );
      this.filePos += BigInt(buffer.byteLength);
      nwritten += iovec.buf_len;
    }
    return { ret: 0, nwritten };
  }

  fd_filestat_get(): { ret: number; filestat: wasi.Filestat } {
    return { ret: 0, filestat: this.file.stat() };
  }
}

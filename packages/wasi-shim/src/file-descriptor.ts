/* eslint-disable unused-imports/no-unused-vars */
import * as wasi from "./wasi-defs";

export type RetVal_nread = { ret: number; nread: number };
export type RetVal_nwritten = { ret: number; nwritten: number };
export type RetVal_offset = { ret: number; offset: bigint };
export type RetVal_filestat = { ret: number; filestat: wasi.Filestat | null };
export type RetVal_fdstat = { ret: number; fdstat: wasi.Fdstat | null };
export type RetVal_prestat = { ret: number; prestat: wasi.Prestat | null };
export type RetVal_prestat_dir_name = { ret: number; prestat_dir_name: string | null };
export type RetVal_dirent = { ret: number; dirent: wasi.Dirent | null };
export type RetVal_fd_obj = { ret: number; fd_obj: Fd | null };

export class Fd {
  fd_filestat_get(): RetVal_filestat {
    return { ret: -1, filestat: null };
  }

  fd_fdstat_get(): RetVal_fdstat {
    return { ret: -1, fdstat: null };
  }

  fd_prestat_get(): RetVal_prestat {
    return { ret: -1, prestat: null };
  }

  fd_prestat_dir_name(path_ptr: number, path_len: number): RetVal_prestat_dir_name {
    return { ret: -1, prestat_dir_name: null };
  }

  fd_read(view8: Uint8Array, iovs: Array<wasi.Iovec>): Promise<RetVal_nread> | RetVal_nread {
    return { ret: -1, nread: 0 };
  }

  fd_pread(view8: Uint8Array, iovs: Array<wasi.Iovec>, offset: bigint): RetVal_nread {
    return { ret: -1, nread: 0 };
  }

  fd_write(view8: Uint8Array, iovs: Array<wasi.Iovec>): RetVal_nwritten {
    return { ret: -1, nwritten: 0 };
  }

  fd_pwrite(view8: Uint8Array, iovs: Array<wasi.Iovec>, offset: bigint): RetVal_nwritten {
    return { ret: -1, nwritten: 0 };
  }

  fd_close(): number {
    return 0;
  }

  fd_readdir_single(cookie: bigint): Promise<RetVal_dirent> | RetVal_dirent {
    return { ret: -1, dirent: null };
  }

  path_filestat_get(flags: number, path: string): Promise<RetVal_filestat> | RetVal_filestat {
    return { ret: -1, filestat: null };
  }

  path_open(
    dirflags: number,
    path: string,
    oflags: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
    fd_flags: number,
  ): Promise<RetVal_fd_obj> | RetVal_fd_obj {
    return { ret: -1, fd_obj: null };
  }

  fd_advise(offset: bigint, len: bigint, advice: number): number {
    return -1;
  }
}

import { Fd, RetVal_dirent, RetVal_fd_obj, RetVal_filestat } from "../file-descriptor";
import { isPromise } from "../utils";
import * as wasi from "../wasi-defs";

import { CacheHandlerI } from "./cache-handle";
import { FSAFile } from "./fsa-file";

type FileOrDirectory = FSADirectory | FSAFile;

export class FSADirectory {
  constructor(
    public handle: FileSystemDirectoryHandle,
    public cache: CacheHandlerI,
  ) {}

  stat(): wasi.Filestat {
    return new wasi.Filestat(wasi.FILETYPE_DIRECTORY, 0n);
  }

  open(fd_flags: number): OpenFSADirectory {
    return new OpenFSADirectory(this);
  }

  async get_entry_for_path(path: string): Promise<FileOrDirectory | null> {
    if (path === ".") return this;

    const cacheResult = this.cache.lookup(path);

    if (!cacheResult) {
      return null;
    }

    if (cacheResult.kind === "file") {
      return new FSAFile(cacheResult);
    }

    return new FSADirectory(cacheResult, this.cache.create(path));
  }
}

export class OpenFSADirectory extends Fd {
  constructor(public dir: FSADirectory) {
    super();
  }

  path_filestat_get(flags: number, path: string): RetVal_filestat | Promise<RetVal_filestat> {
    return this.dir.get_entry_for_path(path).then((entry) => {
      if (!entry) {
        return { ret: wasi.ERRNO_NOENT, filestat: null };
      }

      const stat = entry.stat();

      if (isPromise(stat)) {
        return stat.then((stat) => {
          return { ret: 0, filestat: stat };
        });
      }

      return { ret: 0, filestat: stat };
    });
  }

  fd_fdstat_get(): { ret: number; fdstat: wasi.Fdstat | null } {
    return { ret: 0, fdstat: new wasi.Fdstat(wasi.FILETYPE_DIRECTORY, 0) };
  }

  async fd_readdir_single(cookie: bigint): Promise<RetVal_dirent> {
    const children = await this.dir.cache.getFilesInDirectory();

    if (cookie >= BigInt(Object.keys(children).length)) {
      return { ret: 0, dirent: null };
    }

    const entries = Object.entries(children)
      .sort(([_, a], [__, b]) => {
        if (a.kind === "file" && b.kind === "directory") {
          return 1;
        } else if (a.kind === "directory" && b.kind === "file") {
          return -1;
        } else {
          return 0;
        }
      })
      .map(([name]) => name);

    const name = entries[Number(cookie)];
    const entry = children[name];

    return {
      ret: 0,
      dirent: new wasi.Dirent(
        cookie + 1n,
        name,
        entry.kind === "file" ? wasi.FILETYPE_REGULAR_FILE : wasi.FILETYPE_DIRECTORY,
      ),
    };
  }

  async path_open(
    dirflags: number,
    path: string,
    oflags: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
    fd_flags: number,
  ): Promise<RetVal_fd_obj> {
    const entry = await this.dir.get_entry_for_path(path);

    if (entry == null && (oflags & wasi.OFLAGS_CREAT) == wasi.OFLAGS_CREAT) {
      //const is_dir = (oflags & wasi.OFLAGS_DIRECTORY) == wasi.OFLAGS_DIRECTORY;
      // not implemented yet
    } else if ((oflags & wasi.OFLAGS_EXCL) == wasi.OFLAGS_EXCL) {
      // was supposed to be created exclusively, but exists already
      return { ret: wasi.ERRNO_EXIST, fd_obj: null };
    }

    if (!entry) {
      return { ret: wasi.ERRNO_NOENT, fd_obj: null };
    }

    if ((oflags & wasi.OFLAGS_DIRECTORY) == wasi.OFLAGS_DIRECTORY && entry instanceof FSAFile) {
      // file is actually a directory
      return { ret: wasi.ERRNO_ISDIR, fd_obj: null };
    }

    return {
      ret: 0,
      fd_obj: await entry.open(fd_flags),
    };
  }
}

import { Fd, RetVal_dirent, RetVal_fd_obj } from "../file-descriptor";
import * as wasi from "../wasi-defs";

import { FSAFile } from "./fsa-file";

type FileOrDirectory = FSADirectory | FSAFile;

export class FSADirectory {
  handle: FileSystemDirectoryHandle;

  constructor(handle: FileSystemDirectoryHandle) {
    this.handle = handle;
  }

  open(fd_flags: number): OpenFSADirectory {
    return new OpenFSADirectory(this);
  }

  async get_entry_for_path(path: string): Promise<FileOrDirectory | null> {
    let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = this.handle;

    for (const part of path.split("/")) {
      if (part == "") break;
      if (part == ".") continue;

      if (currentHandle.kind !== "directory") {
        return null;
      }

      let childHandle: FileSystemFileHandle | FileSystemDirectoryHandle | undefined;
      let childName: string | undefined;
      for await (const [name, handle] of currentHandle.entries()) {
        if (name === part) {
          childHandle = handle;
          childName = name;
        }
      }
      if (!childHandle || !childName) {
        return null;
      }

      currentHandle = childHandle;
    }

    if (this.handle === currentHandle) {
      return this;
    }

    if (currentHandle.kind === "file") {
      return new FSAFile(currentHandle);
    }

    return new FSADirectory(currentHandle);
  }
}

export class OpenFSADirectory extends Fd {
  constructor(private dir: FSADirectory) {
    super();
  }

  fd_fdstat_get(): { ret: number; fdstat: wasi.Fdstat | null } {
    return { ret: 0, fdstat: new wasi.Fdstat(wasi.FILETYPE_DIRECTORY, 0) };
  }

  async fd_readdir_single(cookie: bigint): Promise<RetVal_dirent> {
    const children: Record<string, FileSystemDirectoryHandle | FileSystemFileHandle> = {};

    for await (const [name, handle] of this.dir.handle.entries()) {
      children[name] = handle;
    }

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

import { Fd } from "../file-descriptor";
import * as wasi from "../wasi-defs";

import { MemoryFile } from "./memory-file";

export type FileOrDirectory = MemoryFile | MemoryDirectory;

function isDirectory(entry: FileOrDirectory): entry is MemoryDirectory {
  return entry instanceof MemoryDirectory;
}

export class MemoryDirectory {
  contents: { [key: string]: FileOrDirectory };
  readonly = false;

  constructor(contents: { [key: string]: FileOrDirectory }) {
    this.contents = contents;
  }

  open(fd_flags: number) {
    return new OpenMemoryDirectory(this);
  }

  stat(): wasi.Filestat {
    return new wasi.Filestat(wasi.FILETYPE_DIRECTORY, 0n);
  }

  get_entry_for_path(path: string): FileOrDirectory | null {
    let entry: FileOrDirectory = this;
    for (const component of path.split("/")) {
      if (component == "") break;
      if (component == ".") continue;
      if (!isDirectory(entry)) {
        return null;
      }
      if (entry.contents[component] == undefined) {
        return null;
      } else {
        entry = entry.contents[component];
      }
    }
    return entry;
  }

  create_entry_for_path(path: string, is_dir: boolean): FileOrDirectory {
    let entry: MemoryFile | MemoryDirectory = this;
    const components: Array<string> = path.split("/").filter((component) => component != "/");
    for (let i = 0; i < components.length; i++) {
      const component = components[i];

      if (isDirectory(entry) && entry.contents[component] != undefined) {
        entry = entry.contents[component];
      } else if (isDirectory(entry)) {
        entry.contents[component] =
          i == components.length - 1 && !is_dir ? new MemoryFile() : new MemoryDirectory({});
        entry = entry.contents[component];
      }
    }
    return entry;
  }

  toJSON() {
    const result: Record<string, any> = {};
    for (const [name, entry] of Object.entries(this.contents)) {
      result[name] = entry.toJSON();
    }
    return result;
  }
}

export class OpenMemoryDirectory extends Fd {
  dir: MemoryDirectory;

  constructor(dir: MemoryDirectory) {
    super();
    this.dir = dir;
  }

  path_filestat_get(flags: number, path: string): { ret: number; filestat: wasi.Filestat | null } {
    const entry = this.dir.get_entry_for_path(path);
    if (entry == null) {
      return { ret: wasi.ERRNO_NOENT, filestat: null };
    }
    return { ret: 0, filestat: entry.stat() };
  }

  fd_fdstat_get(): { ret: number; fdstat: wasi.Fdstat | null } {
    return { ret: 0, fdstat: new wasi.Fdstat(wasi.FILETYPE_DIRECTORY, 0) };
  }

  fd_readdir_single(cookie: bigint): {
    ret: number;
    dirent: wasi.Dirent | null;
  } {
    if (cookie >= BigInt(Object.keys(this.dir.contents).length)) {
      return { ret: 0, dirent: null };
    }

    const entries = Object.entries(this.dir.contents)
      .sort(([_, a], [__, b]) => {
        return a.stat().filetype - b.stat().filetype;
      })
      .map(([name]) => name);

    const name = entries[Number(cookie)];
    const entry = this.dir.contents[name];

    return {
      ret: 0,
      dirent: new wasi.Dirent(cookie + 1n, name, entry.stat().filetype),
    };
  }

  path_open(
    dirflags: number,
    path: string,
    oflags: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
    fd_flags: number,
  ): { ret: number; fd_obj: Fd | null } {
    let entry = this.dir.get_entry_for_path(path);
    if (entry == null) {
      if ((oflags & wasi.OFLAGS_CREAT) == wasi.OFLAGS_CREAT) {
        // doesn't exist, but shall be created
        entry = this.dir.create_entry_for_path(
          path,
          (oflags & wasi.OFLAGS_DIRECTORY) == wasi.OFLAGS_DIRECTORY,
        );
      } else {
        // doesn't exist, no such file
        return { ret: wasi.ERRNO_NOENT, fd_obj: null };
      }
    } else if ((oflags & wasi.OFLAGS_EXCL) == wasi.OFLAGS_EXCL) {
      // was supposed to be created exclusively, but exists already
      return { ret: wasi.ERRNO_EXIST, fd_obj: null };
    }
    if (
      (oflags & wasi.OFLAGS_DIRECTORY) == wasi.OFLAGS_DIRECTORY &&
      entry.stat().filetype != wasi.FILETYPE_DIRECTORY
    ) {
      // file is actually a directory
      return { ret: wasi.ERRNO_ISDIR, fd_obj: null };
    }
    if (
      entry.readonly &&
      (fs_rights_base & BigInt(wasi.RIGHTS_FD_WRITE)) == BigInt(wasi.RIGHTS_FD_WRITE)
    ) {
      // no write permission to file
      return { ret: wasi.ERRNO_PERM, fd_obj: null };
    }
    if (!(entry instanceof MemoryDirectory) && (oflags & wasi.OFLAGS_TRUNC) == wasi.OFLAGS_TRUNC) {
      // truncate existing file first
      const ret = entry.truncate?.();
      if (ret != wasi.ERRNO_SUCCESS) return { ret, fd_obj: null };
    }
    return { ret: wasi.ERRNO_SUCCESS, fd_obj: entry.open(fd_flags) };
  }
}

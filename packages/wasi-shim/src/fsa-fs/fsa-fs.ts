import { RetVal_prestat, RetVal_prestat_dir_name } from "../file-descriptor";
import * as wasi from "../wasi-defs";

import { FSADirectory, OpenFSADirectory } from "./fsa-directory";

export class FsaFS extends OpenFSADirectory {
  static async fromDirectoryHandle(
    name: string,
    handle: FileSystemDirectoryHandle,
  ): Promise<FsaFS> {
    return new FsaFS(name, handle);
  }

  constructor(
    private name: string,
    handle: FileSystemDirectoryHandle,
  ) {
    super(new FSADirectory(handle));
  }

  fd_prestat_get(): RetVal_prestat {
    return {
      ret: 0,
      prestat: wasi.Prestat.dir(this.name.length),
    };
  }

  fd_prestat_dir_name(): RetVal_prestat_dir_name {
    return {
      ret: 0,
      prestat_dir_name: this.name,
    };
  }
}

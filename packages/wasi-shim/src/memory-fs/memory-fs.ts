import { RetVal_prestat, RetVal_prestat_dir_name } from "../file-descriptor";
import * as wasi from "../wasi-defs";

import { FileOrDirectory, MemoryDirectory, OpenMemoryDirectory } from "./memory-directory";

export class MemoryFS extends OpenMemoryDirectory {
  prestat_name: string;

  constructor(name: string, contents: { [key: string]: FileOrDirectory } | MemoryDirectory) {
    if (contents instanceof MemoryDirectory) {
      super(contents);
    } else {
      super(new MemoryDirectory(contents));
    }
    this.prestat_name = name;
  }

  fd_prestat_get(): RetVal_prestat {
    return {
      ret: 0,
      prestat: wasi.Prestat.dir(this.prestat_name.length),
    };
  }

  fd_prestat_dir_name(): RetVal_prestat_dir_name {
    return {
      ret: 0,
      prestat_dir_name: this.prestat_name,
    };
  }

  toJSON() {
    return {
      [this.prestat_name]: this.dir.toJSON(),
    };
  }
}

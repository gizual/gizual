import { RetVal_prestat, RetVal_prestat_dir_name } from "../file-descriptor";
import * as wasi from "../wasi-defs";

import { CacheHandler, pathJoin } from "./cache-handle";
import { FSADirectory, OpenFSADirectory } from "./fsa-directory";

export class FsaFS extends OpenFSADirectory {
  cache: Record<string, FileSystemFileHandle | FileSystemDirectoryHandle> = {};

  static async fromDirectoryHandle(
    name: string,
    handle: FileSystemDirectoryHandle,
    includes: string[] = [],
  ): Promise<FsaFS> {
    const fsaFS = new FsaFS(name, handle);
    await fsaFS.hydrateCache(includes);

    return fsaFS;
  }

  constructor(
    public name: string,
    public handle: FileSystemDirectoryHandle,
  ) {
    super(new FSADirectory(handle, undefined));
    this.dir.cache = new CacheHandler(this);
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

  async hydrateCache(includes: string[]): Promise<void> {
    let fileCounter = 0;
    let dirCounter = 0;
    const hydrateFolder = (
      p: string,
      dir: FileSystemDirectoryHandle,
      includes: string[] = [],
    ): Promise<void> => {
      return (async () => {
        for await (const [name, handle] of dir.entries()) {
          const path = pathJoin(p, name);
          if (includes.length > 0 && !includes.some((i) => path.startsWith(i))) {
            continue;
          }
          this.cache[path] = handle;
          if (handle.kind === "directory") {
            dirCounter++;
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                hydrateFolder(path, handle).then(resolve, reject);
              }, 1);
            });
          } else {
            fileCounter++;
          }
        }
      })();
    };
    await hydrateFolder("", this.handle, includes);
  }

  lookup(filePath: string) {
    if (filePath.endsWith("/")) {
      filePath = filePath.slice(0, -1);
    }

    if (this.cache[filePath]) {
      return this.cache[filePath];
    }
    return;
  }
}

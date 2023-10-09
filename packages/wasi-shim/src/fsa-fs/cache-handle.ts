import { FsaFS } from "./fsa-fs";

export function pathJoin(a: string, b: string) {
  if (a === "") return b;
  if (b === "") return a;
  return a + "/" + b;
}

export type CacheHandlerI = {
  create(prefix: string): CacheHandlerI;
  lookupInDir(
    dirPath: string,
    filePath: string,
  ): FileSystemFileHandle | FileSystemDirectoryHandle | undefined;
  lookup(path: string): FileSystemFileHandle | FileSystemDirectoryHandle | undefined;
};

export class CacheHandler implements CacheHandlerI {
  constructor(public fs: FsaFS) {}

  create(prefix: string): PrefixedCacheHandler {
    if (prefix.endsWith("/")) {
      prefix = prefix.slice(0, -1);
    }

    return new PrefixedCacheHandler(prefix, this);
  }

  lookup(filePath: string) {
    return this.fs.lookup(filePath);
  }

  lookupInDir(dirPath: string, filePath: string) {
    return this.lookup(pathJoin(dirPath, filePath));
  }
}

export class PrefixedCacheHandler implements CacheHandlerI {
  constructor(
    public prefix: string,
    public parent: CacheHandler,
  ) {}

  create(prefix: string): PrefixedCacheHandler {
    return this.parent.create(pathJoin(this.prefix, prefix));
  }

  lookup(filePath: string) {
    return this.parent.lookup(pathJoin(this.prefix, filePath));
  }
  lookupInDir(dirPath: string, filePath: string) {
    return this.lookup(pathJoin(dirPath, filePath));
  }
}

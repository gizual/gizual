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
  getFilesInDirectory(): Record<string, FileSystemDirectoryHandle | FileSystemFileHandle>;
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

  getFilesInDirectory() {
    return getFilesOfDirectoryFromCache(this.fs.cache, "");
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

  getFilesInDirectory() {
    const dirPath = this.prefix;

    return getFilesOfDirectoryFromCache(this.parent.fs.cache, dirPath);
  }
}

function getFilesOfDirectoryFromCache(
  cache: Record<string, FileSystemDirectoryHandle | FileSystemFileHandle>,
  dirPath: string,
) {
  const result: Record<string, FileSystemDirectoryHandle | FileSystemFileHandle> = {};
  const entries = Object.keys(cache)
    .filter((k) => k.startsWith(dirPath))
    .filter((k) => k !== dirPath)
    .map((k) => k.replace(dirPath + "/", ""))
    .filter((k) => !k.includes("/"));

  for (const entry of entries) {
    result[entry] = cache[pathJoin(dirPath, entry)];
  }

  return result;
}

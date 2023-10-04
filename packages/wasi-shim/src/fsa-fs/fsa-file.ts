import { MemoryFile, MemoryOpenFile } from "../memory-fs";
import * as wasi from "../wasi-defs";

export class FSAFile {
  handle: FileSystemFileHandle;
  constructor(handle: FileSystemFileHandle) {
    this.handle = handle;
  }

  async open(fd_flags: number): Promise<MemoryOpenFile> {
    const file = await this.handle.getFile();
    return new MemoryOpenFile(new MemoryFile(await file.arrayBuffer(), { readonly: true }));
  }

  async stat(): Promise<wasi.Filestat> {
    const file = await this.handle.getFile();
    return new wasi.Filestat(wasi.FILETYPE_REGULAR_FILE, BigInt(file.size));
  }
}

import { MemoryFile, MemoryOpenFile } from "../memory-fs";

export class FSAFile {
  handle: FileSystemFileHandle;
  constructor(handle: FileSystemFileHandle) {
    this.handle = handle;
  }

  async open(fd_flags: number): Promise<MemoryOpenFile> {
    const file = await this.handle.getFile();
    return new MemoryOpenFile(new MemoryFile(await file.arrayBuffer(), { readonly: true }));
  }
}

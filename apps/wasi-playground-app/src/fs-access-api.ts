interface Memory {
  readonly buffer: ArrayBuffer;
  grow(delta: number): number;
}

type ExportValue = Function | Memory;
type ImportValue = ExportValue | number;
type Imports = Record<string, ModuleImports>;
type ModuleImports = Record<string, ImportValue>;

export type FSAccessAPIFileSystemOpts = {
  wasiImports: Imports;
  prefixPath: string;
  handle: FileSystemDirectoryHandle;
};

const WASI_ESUCCESS = 0;
const WASI_EBADF = 8;
const WASI_EINVAL = 28;
const WASI_ENOSYS = 52;

const constants = {
  O_RDONLY: 0x00_00,
  O_WRONLY: 0x00_01,
  O_RDWR: 0x00_02,
  O_CREAT: 0x00_40,
  O_APPEND: 0x04_00,
  S_IFREG: 0x80_00,
  S_IFDIR: 0x40_00,
  R_OK: 0x04,
  W_OK: 0x02,
  X_OK: 0x01,
};

type DirHandle = {
  fd: number;
  handle?: FileSystemDirectoryHandle;
  type: "directory";
  fullPath: string;
  name: string;
};

type FileHandle = {
  fd: number;
  handle: FileSystemFileHandle;
  type: "file";
  fullPath: string;
  name: string;
  offset: number;
};

export type Handle = DirHandle | FileHandle;

function isFileHandle(handle: Handle): handle is FileHandle {
  return handle.type === "file";
}

function isDirHandle(handle: Handle): handle is DirHandle {
  return handle.type === "directory";
}

interface Iovec {
  iov_base: number;
  iov_len: number;
}

const STDIN_FD = 0;
const STDOUT_FD = 1;
const STDERR_FD = 2;
const ROOT_FD = 3;

export class AsyncFS {
  originalImports!: any;
  nextFd = 5;
  FDs: Map<number, Handle> = new Map();

  memory!: WebAssembly.Memory;
  view!: DataView;

  stdoutBuffer = "";

  mappings: Map<string, FileSystemDirectoryHandle> = new Map();

  constructor(mappedPaths: Record<string, FileSystemDirectoryHandle>) {
    this.mappings = new Map();

    for (const [key, value] of Object.entries(mappedPaths)) {
      let k = key;
      if (key.startsWith("/")) {
        k = key.slice(1);
      }
      this.mappings.set(k, value);
    }
  }

  setMemory(memory: WebAssembly.Memory) {
    this.memory = memory;
    this.view = new DataView(memory.buffer);
  }

  refreshMemory() {
    this.view = new DataView(this.memory.buffer);
  }

  setOriginalImports(imports: Imports) {
    this.originalImports = imports;
  }

  parseIovecArray(iovecPtr: number, len: number): Iovec[] {
    const iovecs: Iovec[] = [];

    for (let i = 0; i < len; i++) {
      const iov_base = this.view.getInt32(iovecPtr + i * 8, true);
      const iov_len = this.view.getInt32(iovecPtr + i * 8 + 4, true);
      iovecs.push({ iov_base, iov_len });
    }

    return iovecs;
  }

  countIovecBytes(iovecs: Iovec[]): number {
    let total = 0;
    for (const iov of iovecs) {
      total += iov.iov_len;
    }
    return total;
  }

  readStringFromMemory(ptr: number, len: number): string {
    const buf = new Uint8Array(this.memory.buffer, ptr, len);
    return new TextDecoder().decode(buf);
  }
  iovecToString(iovec: Iovec): string {
    return this.readStringFromMemory(iovec.iov_base, iovec.iov_len);
  }

  iovecsToString(iovs: Iovec[]): string {
    let output = "";
    for (const iov of iovs) {
      output += this.iovecToString(iov);
    }
    return output;
  }

  async getFileHandleFromFd(fd: number): Promise<FileHandle> {
    const fileHandle = this.FDs.get(fd);
    if (!fileHandle) {
      throw new Error(`File descriptor ${fd} not found`);
    }
    if (!isFileHandle(fileHandle)) {
      console.error(fileHandle);
      throw new Error(`File descriptor ${fd} not a directory`);
    }
    return fileHandle;
  }

  async getDirectoryHandleFromFd(fd: number): Promise<DirHandle> {
    const directoryHandle = this.FDs.get(fd);
    if (!directoryHandle) {
      throw new Error(`Directory descriptor ${fd} not found`);
    }
    if (!isDirHandle(directoryHandle)) {
      console.error(directoryHandle);
      throw new Error(`Directory descriptor ${fd} not a directory`);
    }
    return directoryHandle;
  }

  async handleStdout(iovecPtr: number, len: number) {
    const iovecs = this.parseIovecArray(iovecPtr, len);
    const output = this.iovecsToString(iovecs);
    console.log("stdout:", output);
    this.stdoutBuffer += output;
  }

  getStdout() {
    const output = this.stdoutBuffer;
    this.stdoutBuffer = "";
    return output;
  }

  async getFSHandle(
    path: string,
    directoryHandle: FileSystemDirectoryHandle
  ): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | undefined> {
    const parts = path.split("/");
    let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = directoryHandle;

    for (const part of parts) {
      console.log("step", part, currentHandle.name);
      if (part === "") {
        continue;
      }

      let childHandle: FileSystemFileHandle | FileSystemDirectoryHandle | undefined;
      let childName: string | undefined;
      for await (const [name, handle] of currentHandle as FileSystemDirectoryHandle) {
        if (name === part) {
          childHandle = handle;
          childName = name;
          console.log("FOUND", { childName, childHandle });
        }
      }

      if (!childHandle || !childName) {
        return undefined;
      }

      currentHandle = childHandle;
    }

    return currentHandle;
  }

  async open(
    path: string,
    directoryHandle: FileSystemDirectoryHandle
  ): Promise<Handle | undefined> {
    const handle = await this.getFSHandle(path, directoryHandle);
    if (!handle) {
      return undefined;
    }
    if (handle.kind === "file") {
      const info: FileHandle = {
        handle,
        type: "file",
        fd: this.nextFd++,
        fullPath: path,
        name: handle.name,
        offset: 0,
      };
      this.FDs.set(info.fd, info);
      return info;
    }

    const info: Handle = {
      handle,
      type: "directory",
      fd: this.nextFd++,
      fullPath: path,
      name: handle.name,
    };
    this.FDs.set(info.fd, info);
    return info;
  }

  private async forEachIoVec(
    iovsPtr: number,
    iovsLen: number,
    finishedPtr: number,
    cb: (buf: Uint8Array) => Promise<number>
  ) {
    const iovecs = this.parseIovecArray(iovsPtr, iovsLen);

    let bytesFinished = 0;

    for (const iov of iovecs) {
      if (iov.iov_len === 0) {
        console.log("found empty iov, skipping");
        continue;
      }
      const buf = new Uint8Array(this.memory.buffer, iov.iov_base, iov.iov_len);
      const handled = await cb(buf);
      bytesFinished += handled;
      if (handled < iov.iov_len) {
        break;
      }
    }
    this.view.setBigUint64(finishedPtr, BigInt(bytesFinished), true);
    return bytesFinished;
  }

  getImports(): Imports {
    return {
      wasi_snapshot_preview1: {
        ...this.originalImports.wasi_snapshot_preview1,
        fd_write: (fd: number, iovecPtr: number, len: number, nwrittenPtr: number) => {
          this.refreshMemory();
          console.log("fd_write", fd, iovecPtr, len, nwrittenPtr);

          if (fd === STDOUT_FD) {
            const ioVecs = this.parseIovecArray(iovecPtr, len);
            const numBytes = this.countIovecBytes(ioVecs);
            this.handleStdout(iovecPtr, len);
            this.view.setInt32(nwrittenPtr, numBytes, true);
            return 0;
          } else if (fd === STDERR_FD) {
            const iovecs = this.parseIovecArray(iovecPtr, len);
            const numBytes = this.countIovecBytes(iovecs);
            const output = this.iovecsToString(iovecs);
            console.error("stderr:", output);
            this.view.setInt32(nwrittenPtr, numBytes, true);
            return 0;
          } else {
            throw new Error(`fd_write: fd ${fd} not implemented`);
          }
          return 0;
        },
        fd_read: async (fd: number, iovecPtr: number, len: number, nreadPtr: number) => {
          this.refreshMemory();
          const handle = await this.getFileHandleFromFd(fd);
          if (!handle) {
            return this.originalImports.wasi_snapshot_preview1.fd_read(fd, iovecPtr, len, nreadPtr);
          }
          let offset = handle.offset;
          await this.forEachIoVec(iovecPtr, len, nreadPtr, async (buf) => {
            const file = await handle.handle.getFile();
            const data = new Uint8Array(await file.arrayBuffer());
            const slicedData = data.subarray(offset, offset + buf.length);
            buf.set(slicedData);
            offset += slicedData.length;

            return slicedData.length;
          });
          handle.offset = offset;

          return 0;
        },
        fd_pread: async (fd: number, iovecPtr: number, len: number, offset: bigint, nreadPtr: number) => {
          this.refreshMemory();
          const handle = await this.getFileHandleFromFd(fd);
          if (!handle) {
            return this.originalImports.wasi_snapshot_preview1.fd_pread(fd, iovecPtr, len, offset, nreadPtr);
          }
          let offsetNum =  Number(offset);

          await this.forEachIoVec(iovecPtr, len, nreadPtr, async (buf) => {
            const file = await handle.handle.getFile();
            const data = new Uint8Array(await file.arrayBuffer());

            const slicedData = data.subarray(offsetNum, offsetNum + buf.length);
            buf.set(slicedData);
            offsetNum += slicedData.length;
            return buf.length;
          });

          return 0;
        },
        fd_seek: (fd: number, offset: number, whence: number, newOffsetPtr: number) => {
          console.error("fd_seek", fd, offset, whence, newOffsetPtr);
          return 0;
        },
        fd_close: (fd: number) => {
          console.error("fd_close", fd);
          return 0;
        },
        fd_prestat_get: (fd: number, prestatPtr: number) => {
          const bufView = new DataView(this.memory.buffer, prestatPtr, 6);

          if (fd === ROOT_FD) {
            bufView.setUint8(0, 0);
            bufView.setUint32(2, 0, true);
            return 0;
          }
          return WASI_EBADF;
        },
        fd_prestat_dir_name: (fd: number, pathPtr: number, pathLen: number) => {
          this.refreshMemory();

          if (fd === ROOT_FD) {
            const path = "/";
            const buf = new TextEncoder().encode(path);
            this.view.setUint8(pathPtr, buf[0]);
            return 0;
          }
        },
        fd_filestat_get: async (fd: number, bufPtr: number) => {
          const fileHandle = await this.getFileHandleFromFd(fd);
          let kind = 4;
          let size = 0;
          if (fileHandle) {
            kind = fileHandle.type === "file" ? 4 : 3;

            if (fileHandle.type === "file") {
              const f = await fileHandle.handle.getFile();
              size = f.size;
            }
          } else {
            return WASI_EBADF;
          }

          // Fill in the filestat struct with fake values
          const fakeTimestamp = BigInt(0);
          this.view.setBigUint64(bufPtr + 0, BigInt(0), true); // dev
          this.view.setBigUint64(bufPtr + 8, BigInt(0), true); // ino
          this.view.setBigUint64(bufPtr + 16, BigInt(kind), true); // file type
          this.view.setBigUint64(bufPtr + 24, BigInt(0), true); // nlink
          this.view.setBigUint64(bufPtr + 32, BigInt(size), true); // size
          this.view.setBigUint64(bufPtr + 40, fakeTimestamp, true); // atim
          this.view.setBigUint64(bufPtr + 48, fakeTimestamp, true); // mtim
          this.view.setBigUint64(bufPtr + 56, fakeTimestamp, true); // ctim

          // Return the status code for success
          return 0;
        },
        fd_fdstat_get: (fd: number, statPtr: number) => {
          this.refreshMemory();

          const memory = new DataView(this.memory.buffer);
          const fdstat = memory.getUint8(statPtr);
          memory.setUint16(fdstat + 2, 0, true ); // flags
          memory.setBigUint64(fdstat + 4, BigInt(0), true ); // rights

          return 0;
        },
        fd_fdstat_set_flags: (fd: number, flags: number) => {
          console.error("fd_fdstat_set_flags", fd, flags);
          return 0;
        },
        fd_fdstat_set_rights: (fd: number, fsRightsBase: number, fsRightsInheriting: number) => {
          console.error("fd_fdstat_set_rights", fd, fsRightsBase, fsRightsInheriting);
          return 0;
        },
        fd_readdir: async (
          fd: number,
          bufPtr: number,
          bufLen: number,
          cookie: bigint,
          bufUsedPtr: number
        ): Promise<number> => {
          this.refreshMemory();
          const handle = await this.getDirectoryHandleFromFd(fd);
          if (!handle) {
            return this.originalImports.wasi_snapshot_preview1.fd_readdir(
              fd,
              bufPtr,
              bufLen,
              cookie,
              bufUsedPtr
            );
          }

          let totalBufSize = 0;

          // Calculate the total size of the directory entries
          for await (const [name] of handle.handle!.entries()) {
            const nameLen = name.length;
            totalBufSize += 8 + 8 + 4 + 1 + nameLen + 6;
          }

          // If the buffer is too small, return the required size
          if (bufLen < totalBufSize) {
            console.log("too small", { bufLen, totalBufSize });
            this.view.setUint32(bufUsedPtr, totalBufSize, true);
            return 0;
          }

          let bufOffset = 0;
          let i = 0;
          for await (const [name, entry] of handle.handle!.entries()) {
            if (i < cookie) {
              // Skip entries before the cookie position
              i++;
              continue;
            }
            const nameLen = name.length;
            let direntSize = 8 + 8 + 4 + 1 + 3 + nameLen;

            direntSize += 8 - (direntSize % 8);
            if (i >= Number(cookie) + bufLen / direntSize) {
              break;
            }
            console.log("write dirent for file", name);
            const type = entry.kind === "directory" ? 3 : 4;
            // Fill in the directory entry
            this.view.setBigUint64(bufPtr + bufOffset, BigInt(i + 1), true); // d_next
            this.view.setBigUint64(bufPtr + bufOffset + 8, BigInt(1), true); // d_ino
            this.view.setUint32(bufPtr + bufOffset + 16, nameLen, true); // d_namlen
            this.view.setUint8(bufPtr + bufOffset + 20, type); // d_type

            const nameBytes = new TextEncoder().encode(name);
            const buf = new Uint8Array(this.memory.buffer, bufPtr + bufOffset + 21 + 3, nameLen);
            buf.set(nameBytes);

            bufOffset += direntSize;
            i++;
          }

          // Report total bytes written
          this.view.setUint32(bufUsedPtr, bufOffset, true);
          console.log("finished",bufOffset , bufPtr);

          return 0;
        },
        path_filestat_get: async (
          fd: number,
          flags: number,
          pathPtr: number,
          pathLen: number,
          bufPtr: number
        ) => {
          this.refreshMemory();

          let path = this.readStringFromMemory(pathPtr, pathLen);
          console.log("oringinal path", path);
          let handle: FileSystemDirectoryHandle | undefined;
          if (fd === ROOT_FD) {

            // accessing root FD, check if path is mapped
            const mappings = [...this.mappings.keys()];
            const mappedPath = mappings.find((mapping) => path.startsWith(mapping));
            console.log({ mappings, mappedPath, path });

            if (mappedPath) {
              handle = this.mappings.get(mappedPath);

              // modify path to remove mapped path prefix
              path = path.replace(mappedPath, "");
              if (path.startsWith("/")) {
                path = path.slice(1);
              }
            } else {

              // path is not mapped, use original implementation
              return this.originalImports.wasi_snapshot_preview1.path_filestat_get(
                fd,
                flags,
                pathPtr,
                pathLen,
                bufPtr
              );
            }
          }

          if (!handle) {
            const h = await this.getDirectoryHandleFromFd(fd);
            handle = h!.handle;
          }

          let kind = 4; // file
          let size = 0;

          const fileHandle = await this.getFSHandle(path, handle!);

          if (fileHandle) {
            kind = fileHandle.kind === "file" ? 4 : 3;

            if (fileHandle.kind === "file") {
              const f = await fileHandle.getFile();
              size = f.size;
            }
          } else {
            return WASI_EBADF;
          }

          console.log("path_filestat_get", fd, path, kind, size);

          const fakeTimestamp = BigInt(Date.now() * 1e6 - 1000);
          this.view.setBigUint64(bufPtr + 0, BigInt(0), true); // dev
          this.view.setBigUint64(bufPtr + 8, BigInt(0), true); // ino
          this.view.setBigUint64(bufPtr + 16, BigInt(kind), true); // file type
          this.view.setBigUint64(bufPtr + 24, BigInt(0), true); // nlink
          this.view.setBigUint64(bufPtr + 32, BigInt(size), true); // size
          this.view.setBigUint64(bufPtr + 40, fakeTimestamp, true); // atim
          this.view.setBigUint64(bufPtr + 48, fakeTimestamp, true); // mtim
          this.view.setBigUint64(bufPtr + 56, fakeTimestamp, true); // ctim

          // Return the status code for success
          return 0;
        },
        path_open: async (
          dirfd: number,
          dirflags: number,
          pathPtr: number,
          pathLen: number,
          oflags: number,
          fsRightsBase: number,
          fsRightsInheriting: number,
          fdflags: number,
          fdPtr: number
        ): Promise<number> => {
          this.refreshMemory();

          let path = this.readStringFromMemory(pathPtr, pathLen);
          const mappedPaths = [...this.mappings.keys()];
          const mappedPath = mappedPaths.find((mapping) => path.startsWith(mapping));
          if (dirfd === ROOT_FD && mappedPath) {

            const mappedHandle = this.mappings.get(mappedPath)!;
            path = path.replace(mappedPath, "");
            if (path.startsWith("/")) {
              path = path.slice(1);
            }

            const fdHandle = await this.open(path, mappedHandle);

            if (!fdHandle) {
              return WASI_EBADF;
            }
            this.view.setBigUint64(fdPtr, BigInt(fdHandle.fd), true);
            return 0;
          }
          return this.originalImports.wasi_snapshot_preview1.path_open(
            dirfd,
            dirflags,
            pathPtr,
            pathLen,
            oflags,
            fsRightsBase,
            fsRightsInheriting,
            fdflags,
            fdPtr
          );
        },
      },
    };
  }
}

/*

export async function createFsAccessAPIFileSystem(opts: FSAccessAPIFileSystemOpts): {imports: Imports, setMemory: (mem: Memory) => void} {
    const { wasiImports, prefixPath, handle: rootDirHandle } = opts;
    const memFsCalls =  wasiImports.wasi_snapshot_preview1;
    if (!memFsCalls) {
        throw new Error('wasi_snapshot_preview1 not found in imports');
    }

    const nextFd = 3;
    const handleMap: Map<number, Handle> = new Map();

    let memory: Memory;
    let view: DataView;






    const imports = {
        wasi_snapshot_preview1: {
            ...wasiImports.wasi_snapshot_preview1,
            path_open: async (dirfd: number, dirflags: number, pathPtr: number, pathLen: number, oflags: number, fsRightsBase: number, fsRightsInheriting: number, fdflags: number, fdPtr: number) => {
                if (dirfd <= 3) {
                    return wasiImports.wasi_snapshot_preview1.path_open(dirfd, dirflags, pathPtr, pathLen, oflags, fsRightsBase, fsRightsInheriting, fdflags, fdPtr);
                }
                const path = readStringFromMemory(pathPtr, pathLen);
                console.log("path_open", path);

                if (!path.startsWith("/repo")) {
                    return wasiImports.wasi_snapshot_preview1.path_open(dirfd, dirflags, pathPtr, pathLen, oflags, fsRightsBase, fsRightsInheriting, fdflags, fdPtr);
                }
                const directoryHandle = await getDirectoryHandleFromFd(dirfd);
                const fileHandle = await open(path, directoryHandle.handle);
                handleMap.set(fileHandle.fd, fileHandle);
                return fileHandle.fd;
            },
            fd_prestat_get: async (fd: number, bufPtr: number) => {
                if (fd < 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_prestat_get(fd, bufPtr);
                }
                const bufView = new DataView(memory.buffer, bufPtr, 6);
                const handle = handleMap.get(fd);
                if (!handle) {
                    return WASI_EBADF;
                }
                const type = handle.type === "directory" ? 0 : 1;
                bufView.setUint8(0, type);
                bufView.setUint32(2, 0, true);
                console.log("fd_prestat_get", type)
                return 0;
            },
            fd_prestat_dir_name: async (fd: number, pathPtr: number, pathLen: number) => {
                if (fd < 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_prestat_dir_name(fd, pathPtr, pathLen);
                }
                if (pathLen === 0) {
                    return 0;
                }
                const path = readStringFromMemory(pathPtr, pathLen);
                const buf = new Uint8Array(memory.buffer, pathPtr, pathLen);
                const handle = await getDirectoryHandleFromFd(fd);
                buf.set(new TextEncoder().encode(handle.name), 0);
                console.log("fd_prestat_dir_name", path, handle.name);

                return 0;

            },
            fd_fdstat_get: (fd: number, bufPtr: number) => {
                console.log("fd_fdstat_get");

                if (fd <= 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_fdstat_get(fd, bufPtr);
                }
            },
            fd_readdir: (fd: number, bufPtr: number, bufLen: number, cookie: number) => {
                console.log("fd_readdir");
                if (fd <= 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_readdir(fd, bufPtr, bufLen, cookie);
                }
            },
            fd_read: async (fd: number, iovsPtr: number, iovsLen: number, nreadPtr: number) => {
                if (fd <= 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_read(fd, iovsPtr, iovsLen, nreadPtr);
                }
                const fileHandle = await getFileHandleFromFd(fd);
                const bufView = new DataView(memory.buffer, iovsPtr, iovsLen);
                return WASI_EBADF;

                const buffer = Buffer.alloc(iovsLen);
                const { bytesRead } = fileHandle.read(buffer);
                iovs.set(buffer);
                nread.writeUInt32LE(bytesRead, 0);
            },
            fd_write: (fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number) => {
                const iocs = parseIovecArray(iovsPtr, iovsLen, view);

                if (fd === 1) {
                    writeIovecToConsole(iocs, memory, "stdout");
                }
                if (fd === 2) {
                    writeIovecToConsole(iocs, memory, "stderr");
                }

                if (fd <= 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_write(fd,  iovsPtr, iovsLen, nwrittenPtr);
                }
                return WASI_EBADF;
            },
            fd_close: (fd: number) => {
                if (fd <= 3) {
                    return wasiImports.wasi_snapshot_preview1.fd_close(fd);
                }
                return WASI_EBADF;

            }
        }

    }
    handleMap.set(3, {
        fd: 4,
        type: "directory",
        handle: rootDirHandle,
        fullPath: "/repo",
        name: "repo",
    })

    return {
        imports,
        setMemory: (mem: Memory) => {
            memory = mem;
            view = new DataView(memory.buffer);
        },
    }

}*/

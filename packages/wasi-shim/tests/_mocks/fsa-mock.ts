export type FSLayout = {
  [path: string]: string | Uint8Array | FSLayout;
};

export function createFSAMock(name: string, layout: FSLayout): FileSystemDirectoryHandle {
  return new FSADirectoryMock(name, layout);
}

class FSADirectoryMock implements FileSystemDirectoryHandle {
  kind = "directory" as const;
  isDirectory = true as const;
  isFile = false as const;
  name: string;

  private directoryHandles: Record<string, FSADirectoryMock> = {};
  private fileHandles: Record<string, FileSystemFileHandle> = {};

  constructor(name: string, layout: FSLayout) {
    this.name = name;
    for (const [name, entry] of Object.entries(layout)) {
      if (typeof entry === "string" || entry instanceof Uint8Array) {
        this.fileHandles[name] = new FSAFileMock(name, entry) as any;
      } else {
        this.directoryHandles[name] = new FSADirectoryMock(name, entry);
      }
    }
  }

  getDirectoryHandle(
    name: string,
    options?: FileSystemGetDirectoryOptions,
  ): Promise<FileSystemDirectoryHandle> {
    if (this.directoryHandles[name]) {
      return Promise.resolve(this.directoryHandles[name]);
    }
    if (this.fileHandles[name]) {
      throw new Error("Not a directory");
    }
    if (options?.create) {
      const newDir = new FSADirectoryMock(name, {});
      this.directoryHandles[name] = newDir;
      return Promise.resolve(newDir);
    }
  }

  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle> {
    if (this.fileHandles[name]) {
      return Promise.resolve(this.fileHandles[name]);
    }
    if (this.directoryHandles[name]) {
      throw new Error("Not a file");
    }
    if (options?.create) {
      const newFile = new FSAFileMock(name, new Uint8Array());
      this.fileHandles[name] = newFile;
      return Promise.resolve(newFile);
    }
  }

  keys(): AsyncIterableIterator<string> {
    const keys = [...Object.keys(this.directoryHandles), ...Object.keys(this.fileHandles)];
    const input = Promise.resolve(keys[Symbol.iterator]());
    return {
      next(value) {
        return input.then((iterator) => iterator.next(value));
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]> {
    const entries = [...Object.entries(this.directoryHandles), ...Object.entries(this.fileHandles)];
    const input = Promise.resolve(entries[Symbol.iterator]());
    return {
      next(value) {
        return input.then((iterator) => iterator.next(value));
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle> {
    throw new Error("Method not implemented.");
  }

  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void> {
    throw new Error("Method not implemented.");
  }
  resolve(possibleDescendant: FileSystemHandle): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  getEntries: () => AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;

  isSameEntry(other: FileSystemHandle): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    throw new Error("Method not implemented.");
  }
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    throw new Error("Method not implemented.");
  }

  getFile(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle> {
    throw new Error("Method not implemented.");
  }

  getDirectory(
    name: string,
    options?: FileSystemGetDirectoryOptions,
  ): Promise<FileSystemDirectoryHandle> {
    throw new Error("Method not implemented.");
  }
  [Symbol.asyncIterator](): AsyncIterableIterator<
    [string, FileSystemDirectoryHandle | FileSystemFileHandle]
  > {
    throw new Error("Method not implemented.");
  }
}

export class FSAFileMock implements FileSystemFileHandle {
  kind = "file" as const;
  isDirectory = false as const;
  isFile = true as const;
  name: string;
  private content: Uint8Array;

  constructor(name: string, content: Uint8Array | string) {
    this.content = typeof content === "string" ? new TextEncoder().encode(content) : content;
    this.name = name;
  }
  getFile(): Promise<File> {
    return Promise.resolve(new File([this.content], "mock"));
  }
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
    throw new Error("Method not implemented.");
  }
  isSameEntry(other: FileSystemHandle): Promise<boolean> {
    return Promise.resolve(this === other);
  }
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    throw new Error("Method not implemented.");
  }
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    throw new Error("Method not implemented.");
  }
}

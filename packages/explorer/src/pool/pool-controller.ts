import * as Comlink from "comlink";
import { UnzipFileInfo, unzipSync } from "fflate";
import { action, makeObservable, observable } from "mobx";

import type { PoolMaster, PoolMetrics } from "./pool-master";

export type PoolControllerOpts = {
  maxConcurrency?: number;
  fileList?: FileList;
  directoryHandle?: FileSystemDirectoryHandle;
  directoryEntry?: FileSystemDirectoryEntry;
  zipFile?: File;
};

function isFileSystemDirectoryEntry(entry: any): entry is FileSystemDirectoryEntry {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "isDirectory" in entry &&
    typeof entry.isDirectory === "boolean" &&
    entry.isDirectory
  );
}

function isFileSystemFileEntry(entry: any): entry is FileSystemFileEntry {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "isFile" in entry &&
    typeof entry.isFile === "boolean" &&
    entry.isFile
  );
}

/**
 * The PoolController is responsible for creating the pool and managing it from the main thread.
 * It can be used to scale the pool up or down, or to terminate it.
 * It can also be used to create new message channel to send jobs to the pool,
 * but can not itself send jobs.
 */
export class PoolController {
  private worker: Worker;
  private pool: Comlink.Remote<PoolMaster>;

  metrics: PoolMetrics = {
    numAvailableWorkers: 0,
    numBusyWorkers: 0,
    numIdleWorkers: 0,
    numJobsInQueue: 0,
    numTotalWorkers: 0,
    numOpenPorts: 0,
  };

  private constructor(worker: Worker, pool: Comlink.Remote<PoolMaster>) {
    this.worker = worker;
    this.pool = pool;

    makeObservable(this, {
      metrics: observable,
      metricsCallback: action.bound,
    });

    this.worker.addEventListener("message", this.metricsCallback);
  }

  static async importDirectoryEntry(
    rootEntry: FileSystemDirectoryEntry,
  ): Promise<FileSystemDirectoryHandle> {
    let directory = await navigator.storage.getDirectory();
    await clearDirectory(directory);

    directory = await directory.getDirectoryHandle("repo", { create: true });
    await clearDirectory(directory);

    // eslint-disable-next-line unicorn/no-for-loop

    const importEntry = async (source: FileSystemEntry, target: FileSystemDirectoryHandle) => {
      if (isFileSystemDirectoryEntry(source)) {
        const dirName = source.name;
        let targetHandle: FileSystemDirectoryHandle;

        try {
          targetHandle = await target.getDirectoryHandle(dirName, { create: false });
        } catch {
          targetHandle = await target.getDirectoryHandle(dirName, { create: true });
        }

        const reader = source.createReader();

        await new Promise<void>((resolve, reject) => {
          const parseEntries = async (entries: FileSystemEntry[]) => {
            // eslint-disable-next-line unicorn/no-for-loop
            for (let i = 0; i < entries.length; i++) {
              const entry = entries[i];
              await importEntry(entry, targetHandle);
            }

            if (entries.length > 0) {
              reader.readEntries(parseEntries, reject);
            } else {
              resolve();
            }
          };

          reader.readEntries(parseEntries, reject);
        });
      } else if (isFileSystemFileEntry(source)) {
        const fileName = source.name;

        const fileHandle = await target.getFileHandle(fileName, { create: true });

        const writable = await fileHandle.createWritable();

        await new Promise((resolve, reject) => {
          source.file((file) => {
            writable.write(file).then(resolve).catch(reject);
          }, reject);
        });

        await writable.close();
      }
    };

    await importEntry(rootEntry, directory);

    return directory;
  }

  static async importFromFileList(files: FileList) {
    let rootDirName = "";
    let isRootDir = false;
    if (files.length > 0) {
      const firstFile = files[0];
      if (firstFile.webkitRelativePath) {
        const parts = firstFile.webkitRelativePath.split("/");
        if (parts.length > 0 && parts[0] !== ".git") {
          rootDirName = parts[0];
          isRootDir = true;
        }
      }
    }

    let directory = await navigator.storage.getDirectory();

    await clearDirectory(directory);

    directory = await directory.getDirectoryHandle("repo", { create: true });

    let currentPath = "";
    let currentHandle = directory;
    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = file.webkitRelativePath;

      // copy files to the file system access api recursively

      const parts = filePath.split("/");
      if (isRootDir) {
        parts.shift();
      }
      const fileName = parts.pop()!;
      const dirPath = parts.join("/");

      if (dirPath !== currentPath) {
        currentPath = dirPath;
        currentHandle = directory;

        const dirParts = dirPath.split("/");

        // eslint-disable-next-line unicorn/no-for-loop
        for (let j = 0; j < dirParts.length; j++) {
          const dirName = dirParts[j];
          currentPath += dirName + "/";
          try {
            currentHandle = await currentHandle.getDirectoryHandle(dirName, { create: false });
          } catch {
            currentHandle = await currentHandle.getDirectoryHandle(dirName, { create: true });
          }
        }
      }

      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });

      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    }

    return directory;
  }

  static async importZipFile(fs: File): Promise<FileSystemDirectoryHandle> {
    let directory = await navigator.storage.getDirectory();
    await clearDirectory(directory);
    directory = await directory.getDirectoryHandle("repo", { create: true });

    const data = await fs.arrayBuffer();

    const unzipped = unzipSync(new Uint8Array(data), {
      filter: (info: UnzipFileInfo) =>
        !info.name.startsWith("__MACOSX") && !info.name.endsWith(".crswap"),
    });

    let currentHandle = directory;
    let currentPath = "";

    for (const [filePath, content] of Object.entries(unzipped)) {
      const pathComponents = filePath.split("/");
      const fileName = pathComponents.pop()!;
      const dirPath = pathComponents.join("/");

      if (dirPath !== currentPath) {
        currentPath = "";
        currentHandle = directory;

        const dirParts = dirPath.split("/");

        // eslint-disable-next-line unicorn/no-for-loop
        for (let j = 0; j < dirParts.length; j++) {
          const dirName = dirParts[j];
          currentPath += dirName + "/";
          try {
            currentHandle = await currentHandle.getDirectoryHandle(dirName, { create: false });
          } catch {
            currentHandle = await currentHandle.getDirectoryHandle(dirName, { create: true });
          }
        }
      }

      if (fileName === "") {
        continue;
      }

      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    }

    return directory;
  }

  static async create(opts: PoolControllerOpts) {
    if (!opts.directoryHandle && !opts.zipFile && !opts.fileList && !opts.directoryEntry) {
      throw new Error("No directory handle or zip file or file list provided");
    }

    if (opts.fileList) {
      opts.directoryHandle = await this.importFromFileList(opts.fileList!);
    } else if (opts.directoryEntry) {
      opts.directoryHandle = await this.importDirectoryEntry(opts.directoryEntry!);
    } else if (opts.zipFile) {
      opts.directoryHandle = await this.importZipFile(opts.zipFile!);
    }

    const worker = new Worker(new URL("pool-master.ts", import.meta.url), { type: "module" });
    const remote = Comlink.wrap<PoolMaster>(worker);

    remote.init(opts.directoryHandle!, opts.maxConcurrency);

    const controller = new PoolController(worker, remote);

    return controller;
  }

  metricsCallback(message: MessageEvent<PoolMetrics>) {
    const metrics = message.data;
    this.metrics.numAvailableWorkers = metrics.numAvailableWorkers ?? 0;
    this.metrics.numBusyWorkers = metrics.numBusyWorkers ?? 0;
    this.metrics.numIdleWorkers = metrics.numIdleWorkers ?? 0;
    this.metrics.numJobsInQueue = metrics.numJobsInQueue ?? 0;
    this.metrics.numTotalWorkers = metrics.numTotalWorkers ?? 0;
    this.metrics.numOpenPorts = metrics.numOpenPorts ?? 0;
  }

  async createPort(): Promise<MessagePort> {
    const { port1, port2 } = new MessageChannel();
    await this.pool.registerPort(Comlink.transfer(port2, [port2]));
    return port1;
  }

  debugPrint() {
    this.pool.debugPrint();
  }
}

async function printFileTree(
  directoryHandle: FileSystemDirectoryHandle,
  currentPath = "",
  indent = "",
) {
  try {
    const entries = await directoryHandle.entries();
    for await (const [name, handle] of entries) {
      if (handle.kind === "file") {
        console.log(indent + name);
      } else if (handle.kind === "directory") {
        console.log(indent + "[" + name + "]");
        await printFileTree(handle, currentPath + name + "/", indent + "  ");
      }
    }
  } catch (error) {
    console.error("Error printing file tree:", error);
  }
}

async function clearDirectory(directoryHandle: FileSystemDirectoryHandle) {
  const entries = await directoryHandle.keys();
  for await (const name of entries) {
    await directoryHandle.removeEntry(name, { recursive: true });
  }
}

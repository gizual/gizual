import { UnzipFileInfo, unzipSync } from "fflate";

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

function shouldIgnoreFilePath(input: string): boolean {
  if (
    input.includes("node_modules") ||
    input.includes(".yarn") ||
    input.includes("target") ||
    input.includes("cache") ||
    input.includes(".cache") ||
    input.includes("__MACOSX")
  ) {
    // TODO: auto detect ignored files from .gitignore
    return true;
  }

  return false;
}

export async function importDirectoryEntry(
  rootEntry: FileSystemDirectoryEntry,
): Promise<FileSystemDirectoryHandle> {
  let directory = await navigator.storage.getDirectory();
  await clearDirectory(directory);

  directory = await directory.getDirectoryHandle("repo", { create: true });
  await clearDirectory(directory);

  // eslint-disable-next-line unicorn/no-for-loop

  const importEntry = async (source: FileSystemEntry, target: FileSystemDirectoryHandle) => {
    if (isFileSystemDirectoryEntry(source)) {
      if (shouldIgnoreFilePath(source.name)) return;

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

export async function importFromFileList(files: FileList) {
  let rootDirName = "";
  let isRootDir = false;
  if (files.length > 0) {
    const firstFile = files[0];
    if (firstFile.webkitRelativePath) {
      const parts = firstFile.webkitRelativePath.split("/");
      if (parts.length > 0 && parts[0] !== ".git") {
        // eslint-disable-next-line unused-imports/no-unused-vars
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

    if (!dirPath.includes(".git")) {
      continue;
    }

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

export async function importZipFile(fs: File): Promise<FileSystemDirectoryHandle> {
  let directory = await navigator.storage.getDirectory();
  await clearDirectory(directory);
  directory = await directory.getDirectoryHandle("repo", { create: true });

  const data = await fs.arrayBuffer();

  const unzipped = unzipSync(new Uint8Array(data), {
    filter: (info: UnzipFileInfo) => !shouldIgnoreFilePath(info.name),
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

export async function printFileTree(
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

export async function seekRepo(
  directoryHandle: FileSystemDirectoryHandle,
  depth = 0,
): Promise<FileSystemDirectoryHandle | undefined> {
  const entries = await directoryHandle.entries();

  for await (const [name, handle] of entries) {
    if (name === ".git" && handle.kind === "directory") {
      return directoryHandle;
    } else if (handle.kind === "directory" && depth < 2) {
      const found = await seekRepo(handle);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}
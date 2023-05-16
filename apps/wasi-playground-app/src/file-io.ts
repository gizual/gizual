import { MemFS } from "@wasmer/wasi";

export type FileRef = {
  parentFolderPath: string;
  fullPath: string;
  filename: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function joinPath(a: string, b: string): string {
  if (!a) {
    return b;
  }

  return `${a}/${b}`;
}

type GetFileRefsOpts = {
  match: (path: string) => boolean;
  parentPath: string;
  modifyWebkitRelativePath: (path: string) => string;
};

const defaultOpts: GetFileRefsOpts = {
  match: () => true,
  modifyWebkitRelativePath: (s) => s,
  parentPath: "",
} as const;

export async function getFileRefs(
  handle: FileSystemDirectoryHandle | File[],
  opts: Partial<GetFileRefsOpts> = {}
): Promise<FileRef[]> {
  if (Array.isArray(handle)) {
    return getFileRefsFromFiles(handle, { ...defaultOpts, ...opts });
  }

  return getFileRefsFromDirectoryHandles(handle, { ...defaultOpts, ...opts });
}

async function getFileRefsFromDirectoryHandles(
  directory: FileSystemDirectoryHandle,
  opts: GetFileRefsOpts
): Promise<FileRef[]> {
  const { match, parentPath } = opts;
  const result: FileRef[] = [];
  for await (const handle of directory.values()) {
    const newParentPath = joinPath(parentPath, handle.name);
    if (!match(newParentPath)) {
      continue;
    }
    if (isDirectory(handle)) {
      const files = await getFileRefsFromDirectoryHandles(handle, {
        ...defaultOpts,
        match,
        parentPath: newParentPath,
      });
      result.push(...files);

      continue;
    }
    const file = await handle.getFile();
    result.push(getFileRefFromFile(file, opts));
  }

  return result;
}

function getFileRefsFromFiles(files: File[], opts: GetFileRefsOpts): FileRef[] {
  const { match, modifyWebkitRelativePath } = opts;
  const result: FileRef[] = [];
  for (const file of files) {
    if (match(modifyWebkitRelativePath(file.webkitRelativePath))) {
      result.push(getFileRefFromFile(file, opts));
    }
  }
  return result;
}

function getFileRefFromFile(
  file: File,
  { modifyWebkitRelativePath, parentPath }: GetFileRefsOpts
): FileRef {
  if (!parentPath) {
    const parts = modifyWebkitRelativePath(file.webkitRelativePath).split("/");
    parts.length = parts.length - 1;
    parentPath = parts.join("/");
  }

  return {
    arrayBuffer: () => file.arrayBuffer(),
    filename: file.name,
    parentFolderPath: parentPath,
    fullPath: joinPath(parentPath, file.name),
  };
}

export function isDirectory(
  handle: FileSystemDirectoryHandle | FileSystemFileHandle
): handle is FileSystemDirectoryHandle {
  return handle.kind === "directory";
}

function ensureDirectoryExists(path: string, fs: MemFS) {
  const parts = path.split("/");

  let current = parts[0] ?? "";

  for (const part of parts) {
    if (!part) {
      current = "/";
      continue;
    }
    const dirPath = joinPath(current, part);

    try {
      fs.createDir(dirPath);
    } catch (error) {
      console.log(error);
    }
    current = dirPath;
  }
}

export async function copyFileRefsToWasmFS(files: FileRef[], fs: MemFS, prefixPath = "") {
  for (const file of files) {
    const dirPath = joinPath(prefixPath, file.parentFolderPath);
    ensureDirectoryExists(dirPath, fs);
    const arrayBuffer = await file.arrayBuffer();
    const f = fs.open(joinPath(dirPath, file.filename), { create: true, write: true });
    f.write(new Uint8Array(arrayBuffer));
    f.free();
  }
}

export async function printDirectory(directory: FileSystemDirectoryHandle, prefix = "") {
  for await (const handle of directory.values()) {
    if (isDirectory(handle)) {
      await printDirectory(handle, `${prefix}/${handle.name}`);
      continue;
    }
    console.log(`${prefix}/${handle.name}`);
  }
}

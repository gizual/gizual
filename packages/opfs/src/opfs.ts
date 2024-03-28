import { createLogger } from "@giz/logging";

export * from "./fileio-utils";

const logger = createLogger("opfs");

export type FSHandle =
  | {
      type: "path";
      kind: "file" | "directory";
      path: string;
    }
  | FileSystemFileHandle
  | FileSystemDirectoryHandle;

export async function serializeHandle(
  h: FileSystemFileHandle | FileSystemDirectoryHandle,
): Promise<FSHandle> {
  const root = await navigator.storage.getDirectory();

  const path = await root.resolve(h);

  if (!path) {
    throw new Error("Failed to resolve handle");
  }

  return {
    type: "path",
    kind: h.kind,
    path: path.join("/"),
  };
}

export async function getNativeFileHandle(
  handle: FSHandle,
): Promise<FileSystemFileHandle | undefined> {
  if (handle instanceof FileSystemFileHandle) {
    return handle;
  }

  if (handle instanceof FileSystemDirectoryHandle) {
    return undefined;
  }

  if (handle.kind === "directory") {
    throw new Error("Invalid handle kind");
  }

  const root = await navigator.storage.getDirectory();

  return await findFileHandle(root, handle.path);
}

export async function getNativeDirectoryHandle(
  handle: FSHandle,
): Promise<FileSystemDirectoryHandle | undefined> {
  if (handle instanceof FileSystemDirectoryHandle) {
    return handle;
  }

  if (handle instanceof FileSystemFileHandle) {
    return undefined;
  }

  if (handle.kind === "file") {
    throw new Error("Invalid handle kind");
  }

  const root = await navigator.storage.getDirectory();

  return await findDirectoryHandle(root, handle.path);
}

export async function findDirectoryHandle(
  h: FileSystemDirectoryHandle | undefined,
  path: string,
  create = false,
): Promise<FileSystemDirectoryHandle | undefined> {
  if (!h) {
    h = await navigator.storage.getDirectory();
  }
  const parts = path.split("/");
  let current = h;
  try {
    for (const part of parts) {
      if (part === "") {
        continue;
      }
      current = await current.getDirectoryHandle(part, { create });
    }
  } catch (e) {
    logger.warn(`Failed to find directory handle at ${path}`, e);
    return undefined;
  }
  return current;
}

export async function findFileHandle(
  h: FileSystemDirectoryHandle | undefined,
  path: string,
  create = false,
): Promise<FileSystemFileHandle | undefined> {
  if (!h) {
    h = await navigator.storage.getDirectory();
  }
  const parts = path.split("/");

  if (parts.length === 0) {
    throw new Error("Invalid path");
  }

  const fileName = parts.pop()!;
  const dirPath = parts.join("/");
  const dir = await findDirectoryHandle(h, dirPath, create);
  if (!dir) {
    logger.warn(`Failed to directory for file handle at "${path}"`);
    return undefined;
  }
  try {
    return await dir.getFileHandle(fileName, { create });
  } catch (e) {
    logger.warn(`Failed to find file handle at ${path}`, e);
    return undefined;
  }
}

export function isValidPath(path: string) {
  return !path.startsWith("/");
}

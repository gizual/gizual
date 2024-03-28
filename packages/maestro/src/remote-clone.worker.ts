import "@giz/logging/worker";

import { Buffer } from "buffer/";

import type * as ServerTypes from "@giz/gizual-api/types";
import { createLogger } from "@giz/logging";
import {
  clearDirectory,
  findDirectoryHandle,
  findFileHandle,
  FSHandle,
  printFileTree,
  serializeHandle,
} from "@giz/opfs";

export type RepoDownloadOpts = {
  service: string;
  repoName: string;
};

const logger = createLogger();

export type DownloadEvent =
  | ServerTypes.CloneProgressEvent
  | ServerTypes.CloneFailedEvent
  | ServerTypes.CloneCompleteEvent
  | { type: "success"; handle: FSHandle };

addEventListener("message", (e) => {
  const data = e.data as RepoDownloadOpts;
  download(data).catch((error) => {
    logger.error("Failed to clone repository", error);
    postMessage({ type: "clone-failed", error: error.message });
  });
});

const API_PATH = "/api";

async function download(opts: RepoDownloadOpts) {
  const { service, repoName } = opts;
  logger.debug("Cloning repository", { service, repoName });
  const sseResponse = new EventSource(`${API_PATH}/on-demand-clone/${service}/${repoName}`);

  let snapshotName = "";
  const onMessage = (e: MessageEvent) => {
    logger.debug("Received message", e.data);

    const data = JSON.parse(e.data);
    if (data.type === "snapshot-created") {
      snapshotName = data.snapshotName;
      return;
    }
    if (data.type === "clone-progress" || data.type === "clone-complete") {
      postMessage(data);
    }
  };

  sseResponse.addEventListener("message", onMessage);

  await new Promise<void>((resolve) => {
    // wait until the EventSource is closed
    sseResponse.addEventListener("error", () => {
      resolve();
    });
  });

  sseResponse.removeEventListener("message", onMessage);
  sseResponse.close();

  logger.debug("Cloning completed");

  if (!snapshotName) {
    throw new Error("Could not find snapshot");
  }

  const url = `${API_PATH}/snapshots/${snapshotName}/`;
  logger.debug("Downloading snapshot", { url });

  const indexResponse = await fetch(url);

  if (!indexResponse.ok) {
    throw new Error("Failed to download snapshot index");
  }

  const index: ServerTypes.SnapshotIndex = await indexResponse.json();

  const directoryHandle = await findDirectoryHandle(undefined, "repo", true);

  if (!directoryHandle) {
    throw new Error("Failed to resolve handle");
  }

  await clearDirectory(directoryHandle);

  const gitDir = await findDirectoryHandle(directoryHandle, ".git", true);

  if (!gitDir) {
    throw new Error("Failed to find .git directory");
  }

  let totalBytes = 0;
  let loadedBytes = 0;

  // Create the directory structure
  for (const file of index) {
    if (file.name.endsWith("/")) {
      await findDirectoryHandle(gitDir, file.name, true);
      continue;
    }

    if (file.size !== undefined) {
      totalBytes += file.size;
    }
  }

  function emitProgress(newBytesProcessed: number) {
    loadedBytes += newBytesProcessed;

    postMessage({
      type: "clone-progress",
      progress: Math.round((loadedBytes / totalBytes) * 100),
      numProcessed: loadedBytes,
      numTotal: totalBytes,
      state: "downloading",
    });
  }

  const promises = index
    .filter((file) => !file.name.endsWith("/"))
    .map(async (file) => {
      const handle = await findFileHandle(gitDir, file.name, true);
      if (!handle) {
        throw new Error("Failed to find file handle");
      }
      const writable = await handle.createSyncAccessHandle();

      if (file.content) {
        const content = Buffer.from(file.content, "base64");
        const bytes = writable.write(content);

        emitProgress(bytes);
      } else {
        const response = await fetch(`${API_PATH}/snapshots/${snapshotName}/${file.name}`);
        if (!response.ok) {
          throw new Error("Failed to download file");
        }

        if (!response.body) {
          throw new Error("Response body is empty");
        }

        const writer = new WritableStream<Uint8Array>({
          write(chunk) {
            emitProgress(chunk.byteLength);
            writable.write(chunk);
          },
          close() {
            writable.close();
          },
        });

        await response.body.pipeTo(writer);
      }

      writable.close();
    });

  await Promise.all(promises);
  await printFileTree(directoryHandle);

  const handle = await serializeHandle(directoryHandle);
  logger.debug(`Zip imported, repository found at`, handle);
  postMessage({ type: "success", handle });
}

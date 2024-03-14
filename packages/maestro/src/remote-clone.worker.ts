import "@giz/logging/worker";

import type * as Events from "@giz/gizual-api/types";
import { createLogger } from "@giz/logging";
import { FSHandle, importZipFile, seekRepo, serializeHandle } from "@giz/opfs";

export type RepoDownloadOpts = {
  service: string;
  repoName: string;
};

const logger = createLogger();

export type DownloadEvent =
  | Events.CloneProgressEvent
  | Events.CloneFailedEvent
  | Events.CloneCompleteEvent
  | { type: "success"; handle: FSHandle };

addEventListener("message", (e) => {
  const data = e.data as RepoDownloadOpts;
  download(data).catch((error) => {
    logger.error("Failed to clone repository", error);
    postMessage({ type: "clone-failed", error: error.message });
  });
});

async function download(opts: RepoDownloadOpts) {
  const { service, repoName } = opts;
  const host = import.meta.env.API_HOST ?? "";
  logger.debug("Cloning repository", { service, repoName });
  const sseResponse = new EventSource(`${host}/on-demand-clone/${service}/${repoName}`);

  let zipFileName = "";
  const onMessage = (e: MessageEvent) => {
    logger.debug("Received message", e.data);

    const data = JSON.parse(e.data);
    if (data.type === "snapshot-created") {
      zipFileName = data.snapshotName;
      return;
    }
    if (data.type === "clone-progress") {
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

  if (!zipFileName) {
    throw new Error("Failed to clone repository");
  }

  const url = `${host}/snapshots/${zipFileName}`;
  logger.debug("Downloading snapshot", { url });
  const response = await fetch(url);

  const data = await response.arrayBuffer();

  let directoryHandle: FileSystemDirectoryHandle | undefined = await importZipFile(data);

  if (!directoryHandle) {
    throw new Error("Failed to import zip file");
  }

  directoryHandle = await seekRepo(directoryHandle);

  if (!directoryHandle) {
    throw new Error("Failed to find repo in zip");
  }

  const handle = await serializeHandle(directoryHandle);
  logger.debug(`Zip imported, repository found at`, handle);
  postMessage({ type: "success", handle });
}

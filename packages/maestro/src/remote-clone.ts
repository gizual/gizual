import type * as Events from "@giz/gizual-api/types";
import type { FSHandle } from "@giz/opfs";
import { GizWorker } from "@giz/worker";

import type { DownloadEvent } from "./remote-clone.worker";
import DownloadWorkerUrl from "./remote-clone.worker?worker&url";

export type DownloadRepoOpts = {
  service: string;
  repoName: string;

  onProgress: (progress: Events.CloneProgressEvent | { type: "clone-complete" }) => void;
};

export async function downloadRepo(opts: DownloadRepoOpts) {
  const worker = new GizWorker(DownloadWorkerUrl, {
    type: "module",
    name: "remote-clone-worker",
  });

  const cleanup = () => {
    worker.terminate();
  };

  return new Promise<FSHandle>((resolve, reject) => {
    worker.onmessage = (e) => {
      const data = e.data as DownloadEvent;
      switch (data.type) {
        case "clone-progress": {
          opts.onProgress(data);
          return;
        }
        case "clone-complete": {
          opts.onProgress(data);
          return;
        }
        case "clone-failed": {
          cleanup();
          reject(new Error(data.error));
          return;
        }

        case "success": {
          cleanup();
          resolve(data.handle);
          return;
        }
      }
    };
    const { service, repoName } = opts;
    worker.postMessage({
      service,
      repoName,
    });
  });
}

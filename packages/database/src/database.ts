import * as Comlink from "comlink";

import { GizWorker } from "@giz/worker";

import type { DatabaseWorker } from "./database-worker";
import DatabaseWorkerURL from "./database-worker?worker&url";

export class Database {
  worker: Comlink.Remote<DatabaseWorker>;

  constructor() {
    this.worker = Comlink.wrap(
      new GizWorker(DatabaseWorkerURL, { type: "module", name: "database-worker" }),
    );
  }

  async init(port: MessagePort) {
    await this.worker.init(Comlink.transfer(port, [port]));
  }

  async selectMatchingFiles(path: string, editedBy: string, commitId: string) {
    return await this.worker.selectMatchingFiles({ path, editedBy }, commitId);
  }

  async queryAuthors(offset: number, limit: number, search?: string) {
    if (search) {
      throw new Error("search is not implemented");
    }
    return await this.worker.queryAuthors(offset, limit);
  }

  async countAuthors() {
    return await this.worker.countAuthors();
  }
}

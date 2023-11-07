import * as Comlink from "comlink";

import type { DatabaseWorker } from "./database-worker";

export class Database {
  worker: Comlink.Remote<DatabaseWorker>;

  constructor() {
    this.worker = Comlink.wrap(
      new Worker(new URL("database-worker.mjs", import.meta.url), { type: "module" }),
    );
  }

  async init(port: MessagePort) {
    await this.worker.init(Comlink.transfer(port, [port]));
  }

  async selectMatchingFiles(path: string, editedBy: string, commitId: string) {
    return await this.worker.selectMatchingFiles({ path, editedBy }, commitId);
  }

  async queryAuthors(offset: number, limit: number) {
    return await this.worker.queryAuthors(offset, limit);
  }
}

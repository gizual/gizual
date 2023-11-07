import { Remote, transfer, wrap } from "comlink";
import { makeObservable, observable, runInAction } from "mobx";

import { webworkerLink } from "@giz/trpc-webworker/link";

import type { MaestroWorker } from "./maestro-worker";

export class Maestro {
  rawWorker!: Worker;
  worker!: Remote<MaestroWorker>;
  link!: ReturnType<typeof webworkerLink>[0];
  dispose!: () => void;
  @observable state: "init" | "ready" | "loading" = "init";

  constructor() {
    console.log("Maestro constructor");

    this.rawWorker = new Worker(new URL("maestro-worker.mjs", import.meta.url), {
      type: "module",
    });
    this.worker = wrap<MaestroWorker>(this.rawWorker);

    this.state = "init";

    makeObservable(this, undefined, { autoBind: true });
  }

  async setup() {
    const { trpcPort } = await this.worker.setup();

    const [link, dispose] = webworkerLink({ port: trpcPort });

    this.link = link;
    this.dispose = dispose;
  }

  async openRepo(port1: MessagePort) {
    this.state = "loading";

    await this.worker.openRepo(transfer(port1, [port1]));

    runInAction(() => {
      this.state = "ready";
    });
  }
}
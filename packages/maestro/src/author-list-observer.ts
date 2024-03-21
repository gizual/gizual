import { action, makeObservable, observable, reaction } from "mobx";

import { Author } from "@giz/explorer";
import { PromiseObserver } from "@giz/explorer-web/ts-src/promise-observer";

import { Maestro } from "./maestro";
import { MaestroWorker } from "./maestro-worker-v2";

export class AuthorListObserver {
  @observable search: string;
  @observable limit: number;
  @observable offset: number;

  authors = observable.box<Author[]>([], { deep: false });

  disposers: (() => void)[] = [];

  observer: PromiseObserver<undefined | Awaited<ReturnType<MaestroWorker["getAuthorList"]>>>;

  constructor(
    private maestro: Maestro,
    limit = 10,
    offset = 0,
    search = "",
  ) {
    this.limit = limit;
    this.offset = offset;
    this.search = search;
    makeObservable(this, undefined, { autoBind: true });

    this.observer = new PromiseObserver({
      name: "author-list",
      cache: false,
      initialPromise: {
        create: this.maestro.getAuthorList,
        args: [this.limit, this.offset, this.search],
      },
      initialValue: undefined,
    });

    this.maestro.on("author-list:need-refresh", this.refresh);

    const dispose1 = reaction(() => [this.limit, this.offset, this.search], this.refresh);

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const dispose2 = () => {
      this.maestro.off("author-list:need-refresh", this.refresh);
    };

    this.disposers.push(dispose1, dispose2);
  }

  @action.bound
  update(limit: number, offset: number, search: string) {
    this.limit = limit;
    this.offset = offset;
    this.search = search;
  }

  @action.bound
  private async refresh() {
    this.observer.update(this.maestro.getAuthorList, this.limit, this.offset, this.search);
  }

  get data() {
    return this.observer.value;
  }

  get loading() {
    return this.observer.loading;
  }

  get error(): string | undefined {
    if (!this.observer.error) return undefined;

    if (this.observer.error instanceof Error) {
      return this.observer.error.message;
    } else {
      return String(this.observer.error);
    }
  }

  dispose() {
    for (const dispose of this.disposers) {
      dispose();
    }
    this.disposers = [];
  }
}

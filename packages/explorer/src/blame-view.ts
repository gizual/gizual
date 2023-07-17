import { computed, makeObservable } from "mobx";

import { Blame } from "@giz/explorer-libgit2";

import { PromiseObserver } from "./promise-observer";
import { Repository } from "./repository";

export class BlameView {
  private repo: Repository;
  private path: string;

  observer: PromiseObserver<Blame>;

  constructor(repo: Repository, path: string) {
    this.repo = repo;
    this.path = path;

    this.observer = new PromiseObserver<Blame>({
      name: `BlameView-${this.path}`,
      initialPromise: {
        create: (b, p) => this.repo.backend!.getBlame(b, p),
        args: [this.repo.selectedBranch, this.path],
      },
    });

    makeObservable(this, {
      loading: computed,
    });
  }

  get loading() {
    return this.observer.loading;
  }

  get blame() {
    return this.observer.value!;
  }

  _refresh() {
    return this.observer.update(
      (b, p) => this.repo.backend!.getBlame(b, p),
      this.repo.selectedBranch,
      this.path
    );
  }

  dispose() {
    this.repo._removeBlame(this);
  }
}

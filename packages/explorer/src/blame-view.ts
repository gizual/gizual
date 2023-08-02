import { computed, makeObservable } from "mobx";

import { PromiseObserver } from "./promise-observer";
import { Repository } from "./repository";
import { Blame } from "./types";

export class BlameView {
  private repo: Repository;
  private path: string;

  observer_preview: PromiseObserver<Blame>;
  observer_full: PromiseObserver<Blame>;

  constructor(repo: Repository, path: string) {
    this.repo = repo;
    this.path = path;

    this.observer_preview = new PromiseObserver<Blame>({
      name: `BlameViewPreview-${this.path}`,
      initialPromise: {
        create: (b, p) => this.repo.backend!.getBlame(b, p, true),
        args: [this.repo.selectedBranch, this.path],
      },
    });

    this.observer_full = new PromiseObserver<Blame>({
      name: `BlameViewFull-${this.path}`,
      initialPromise: {
        create: (b, p) => this.repo.backend!.getBlame(b, p, false),
        args: [this.repo.selectedBranch, this.path],
      },
    });

    makeObservable(this, {
      loading: computed,
      blame: computed,
    });
  }

  get isPreview() {
    return this.observer_full.loading === true;
  }

  get loading() {
    return this.observer_preview.loading;
  }

  get blame() {
    if (this.observer_full.loading === false && this.observer_full.value) {
      return this.observer_full.value!;
    }

    return this.observer_preview.value!;
  }

  _refresh() {
    const preview = this.observer_preview.update(
      (b, p) => this.repo.backend!.getBlame(b, p, true),
      this.repo.selectedBranch,
      this.path,
    );

    const full = this.observer_full.update(
      (b, p) => this.repo.backend!.getBlame(b, p, false),
      this.repo.selectedBranch,
      this.path,
    );

    return Promise.all([preview, full]);
  }

  dispose() {
    this.repo._removeBlame(this);
  }
}

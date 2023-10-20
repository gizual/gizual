import { action, computed, makeObservable, observable } from "mobx";

import { JobRef } from "./explorer-pool";
import { Repository } from "./repository";
import { Blame } from "./types";

export class BlameView {
  private repo: Repository;
  private path: string;
  private priority = 1;

  preview_blame?: Blame;
  preview_blame_job: JobRef<Blame> | undefined;

  full_blame?: Blame;
  full_blame_job: JobRef<Blame> | undefined;

  constructor(repo: Repository, path: string, priority = 1) {
    this.repo = repo;
    this.path = path;
    this.priority = priority;

    makeObservable(this, {
      loading: computed,
      blame: computed,
      full_blame: observable.shallow,
      preview_blame: observable.shallow,
      onReceiveFullBlame: action.bound,
      onReceivePreviewBlame: action.bound,
    });

    this._refreshPreviewBlame();
  }

  get isPreview() {
    return !this.full_blame;
  }

  get loading() {
    return !this.full_blame && !this.preview_blame;
  }

  get blame() {
    if (this.full_blame) {
      return this.full_blame;
    }

    return this.preview_blame;
  }

  setPriority(priority: number) {
    this.priority = priority;

    if (this.preview_blame_job) {
      this.preview_blame_job.setPriority(100 + priority);
    }

    if (this.full_blame_job) {
      if (priority === 0) {
        this.full_blame_job.cancel();
        this.full_blame_job = undefined;
        return;
      }
      this.full_blame_job.setPriority(priority);
    } else if (!this.full_blame) {
      this._refreshFullBlame();
    }
  }

  onReceiveFullBlame(blame: Blame) {
    this.full_blame = blame;
    this.full_blame_job = undefined;
  }

  onReceivePreviewBlame(blame: Blame) {
    this.preview_blame = blame;
    this.preview_blame_job = undefined;
  }

  _refreshFullBlame() {
    if (this.full_blame_job) {
      this.full_blame_job.cancel();

      this.full_blame_job = undefined;
    }

    this.full_blame = undefined;

    this.full_blame_job = this.repo.portal?._enqueueJob({
      method: "blame",
      params: [
        {
          branch: this.repo.selectedBranch,
          path: this.path,
          preview: false,
        },
      ],
      priority: this.priority,
      onEnd: this.onReceiveFullBlame,
      onErr: (err) => console.info(err),
    });
  }

  _refreshPreviewBlame() {
    if (this.preview_blame_job) {
      this.preview_blame_job.cancel();

      this.preview_blame_job = undefined;
    }

    this.preview_blame = undefined;

    this.preview_blame_job = this.repo.portal?._enqueueJob({
      method: "blame",
      params: [
        {
          branch: this.repo.selectedBranch,
          path: this.path,
          preview: true,
        },
      ],
      priority: 100 + this.priority,
      onEnd: this.onReceivePreviewBlame,
      onErr: (err) => console.info(err),
    });
  }

  _refresh() {
    this._refreshPreviewBlame();
    this._refreshFullBlame();
  }

  dispose() {
    if (this.full_blame_job) {
      this.full_blame_job.cancel();
      this.full_blame_job = undefined;
    }

    if (this.preview_blame_job) {
      this.preview_blame_job.cancel();
      this.preview_blame_job = undefined;
    }

    this.repo._removeBlame(this);
  }
}

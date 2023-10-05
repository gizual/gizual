import { CInfo } from "@app/types";
import { getDateFromTimestamp, getStringDate, GizDate, logAllMethods } from "@app/utils";
import { action, autorun, computed, makeObservable, observable, when } from "mobx";

import type { MainController } from "./main.controller";

@logAllMethods("RepoController", "#fffdd8")
export class RepoController {
  @observable private _mainController: MainController;
  @observable private _commitsForBranch?: CInfo[];
  @observable private _commitsPerDate = new Map<string, CInfo[]>();

  // these dates are only used if the user explicitly does not specify a date
  // (by deleting the tag from the search bar).
  @observable private _defaultStartDate?: GizDate;
  @observable private _defaultEndDate?: GizDate;

  constructor(mainController: MainController) {
    this._mainController = mainController;
    makeObservable(this, undefined, { autoBind: true });

    // Since loading the repo data is asynchronous, the timeline positions are
    // just guesses until the repo is done loading.
    when(
      () => this.isDoneLoading,
      () => {
        this.initializePositionsFromLastCommit();
      },
    );

    this.loadCommitsForBranch();

    // This autorun is required because the access to the branches and commits is not
    // properly decentralised yet.
    autorun(() => {
      if (this._mainController.branches.some((b) => b.name === this.selectedBranch))
        this.loadCommitsForBranch();
    });
  }

  private get mainController() {
    return this._mainController;
  }

  get repo() {
    return this._mainController._repo;
  }

  get selectedBranch() {
    return this._mainController.selectedBranch;
  }

  get commitsForBranch() {
    return this._commitsForBranch;
  }

  get commitsPerDate() {
    return this._commitsPerDate;
  }

  get defaultStartDate() {
    return this._defaultStartDate;
  }

  get defaultEndDate() {
    return this._defaultEndDate;
  }

  @computed
  get isDoneLoading() {
    return this.lastCommit !== undefined;
  }

  @computed
  get commitIndices() {
    if (this.repo.gitGraph.loading) return;
    return new Map<string, number>(
      Object.entries(this.mainController._repo.gitGraph.value?.commit_indices ?? {}),
    );
  }

  @computed
  get commits() {
    if (this.mainController._repo.gitGraph.loading) return [];
    return this.mainController._repo.gitGraph.value?.commits ?? [];
  }

  get lastCommit() {
    if (this._commitsForBranch === undefined || this._commitsForBranch.length === 0) return;
    return this._commitsForBranch?.at(0);
  }

  @action.bound
  loadCommitsForBranch() {
    this._commitsForBranch = [];
    const parsedCommits: CInfo[] = [];
    const branch = this._mainController.branches.find((b) => b.name === this.selectedBranch);
    if (!branch) return;
    const origin = branch.last_commit_id;

    if (!this.commitIndices) return;

    const originIndex = this.commitIndices.get(origin);

    if (originIndex === undefined) {
      console.log(
        "Aborting, cannot find origin in indices, origin:",
        origin,
        "indices:",
        this.commitIndices,
      );
      return parsedCommits;
    } //throw new Error(`Could not find commit index for commit ${origin}`);

    const commit = this.commits[originIndex];
    parsedCommits.push(commit);

    let currentCommit = commit;
    this._commitsPerDate.clear();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!currentCommit.parents) break;

      const parentId = currentCommit.parents[0];
      if (parentId === null) break;

      const commitIndex = this.commitIndices.get(parentId!);
      if (!commitIndex) break;

      currentCommit = this.commits[commitIndex];
      if (!currentCommit) break;

      const commitDate = getStringDate(getDateFromTimestamp(currentCommit.timestamp));
      if (this._commitsPerDate.has(commitDate)) {
        this._commitsPerDate.get(commitDate)?.push(currentCommit);
      } else {
        this._commitsPerDate.set(commitDate, [currentCommit]);
      }
      parsedCommits.push(currentCommit as any);
    }

    this._commitsForBranch = parsedCommits;
  }

  initializePositionsFromLastCommit() {
    if (!this.lastCommit) return;
    const defaultSelectionRange =
      this.mainController.settingsController.settings.timelineSettings.defaultRange.value;

    const newSelectedStartDate = getDateFromTimestamp(this.lastCommit.timestamp).subtractDays(
      defaultSelectionRange,
    );
    const newSelectedEndDate = getDateFromTimestamp(this.lastCommit.timestamp);

    this.mainController.setSelectedStartDate(newSelectedStartDate);
    this.mainController.setSelectedEndDate(newSelectedEndDate);

    this._defaultStartDate = newSelectedStartDate;
    this._defaultEndDate = newSelectedEndDate;

    this.mainController.vmController.timelineViewModel?.initializePositionsFromSelection();
    this.mainController.triggerSearchBarUpdate(true);
  }
}

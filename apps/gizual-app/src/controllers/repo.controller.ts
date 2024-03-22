/* eslint-disable unicorn/no-array-push-push */

import { CInfo, FileNodeInfos } from "@app/types";
import {
  action,
  autorun,
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  when,
} from "mobx";

import { createLogger, Logger } from "@giz/logging";
import { getDateFromTimestamp, getStringDate, GizDate } from "@giz/utils/gizdate";

import type { MainController } from "./main.controller";

/**
 * The `RepoController` manages the access to the repository and its data from
 * within the main thread. It is advised to use the hooks provided through the
 * `Maestro` class to access the repository data from the worker thread.
 *
 * @see `@giz/maestro`
 */
export class RepoController {
  @observable private _mainController: MainController;
  @observable private _commitsForBranch?: CInfo[];
  @observable private _commitsPerDate = new Map<string, CInfo[]>();

  @observable private _selectedFiles = new Map<string, FileNodeInfos>();
  @observable private _selectedFilesKeys: string[] = [];

  @observable private _defaultStartDate?: GizDate;
  @observable private _defaultEndDate?: GizDate;

  @observable private _disposers: IReactionDisposer[] = [];

  logger: Logger = createLogger("RepoController");

  constructor(mainController: MainController) {
    this._mainController = mainController;
    makeObservable(this, undefined, { autoBind: true });

    // Since loading the repo data is asynchronous, the timeline positions are
    // just guesses until the repo is done loading.
    this._disposers.push(
      when(
        () => this.isDoneLoading,
        () => {
          this.initializePositionsFromLastCommit();
        },
      ),
    );

    this.loadCommitsForBranch();

    // This autorun is required because the access to the branches and commits is not
    // properly decentralized yet.
    this._disposers.push(
      autorun(() => {
        if (this._mainController.branches.some((b) => b.name === this.selectedBranch))
          this.loadCommitsForBranch();
      }),
    );
  }

  dispose() {
    for (const disposer of this._disposers) {
      disposer();
    }
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

  get selectedFiles() {
    return this._selectedFiles;
  }

  get selectedFilesKeys() {
    return this._selectedFilesKeys;
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
      this.logger.warn(
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

  @action.bound
  initializePositionsFromLastCommit() {
    if (!this.lastCommit) return;
    const defaultSelectionRange =
      this.mainController.settingsController.settings.timelineSettings.defaultRange.value;

    const newSelectedStartDate = getDateFromTimestamp(this.lastCommit.timestamp).subtractDays(
      defaultSelectionRange,
    );
    const newSelectedEndDate = getDateFromTimestamp(this.lastCommit.timestamp);

    this._defaultStartDate = newSelectedStartDate;
    this._defaultEndDate = newSelectedEndDate;

    this.mainController.vmController.timelineViewModel?.initializePositionsFromSelection();
  }

  @action.bound
  toggleFile(name: string, info: FileNodeInfos) {
    if (this._selectedFiles.has(name)) {
      this._selectedFiles.delete(name);
    } else this._selectedFiles.set(name, info);
  }

  @action.bound
  unloadAllFiles() {
    // Unloading the `selectedFiles` is enough, the reaction will propagate through
    // the list of `loadedFiles` and dispose them properly.
    this._selectedFiles.clear();
  }

  @action.bound
  unloadFiles(files: string[] | string) {
    for (const file of files) {
      this._selectedFiles.delete(file);
    }
  }
}

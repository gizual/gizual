/* eslint-disable unicorn/no-array-push-push */

import { CInfo, FileNodeInfos } from "@app/types";
import { VisualizationDefaults } from "@app/utils";
import _ from "lodash";
import {
  action,
  autorun,
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  reaction,
  toJS,
  when,
} from "mobx";

import { Blame, CommitInfo } from "@giz/explorer";
import { BlameView } from "@giz/explorer-web";
import { getDateFromTimestamp, getStringDate, GizDate } from "@giz/utils/gizdate";

import type { MainController } from "./main.controller";

export class RepoController {
  @observable private _mainController: MainController;
  @observable private _commitsForBranch?: CInfo[];
  @observable private _commitsPerDate = new Map<string, CInfo[]>();

  @observable private _selectedFiles = new Map<string, FileNodeInfos>();
  @observable private _loadedFiles = new Map<string, FileModel>();
  @observable private _selectedFilesKeys: string[] = [];
  @observable private _loadedFilesArray: FileModel[] = [];

  // these dates are only used if the user explicitly does not specify a date
  // (by deleting the tag from the search bar).
  @observable private _defaultStartDate?: GizDate;
  @observable private _defaultEndDate?: GizDate;

  @observable private _disposers: IReactionDisposer[] = [];

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

    // As soon as we detect changes in the selected files, we want to start populating
    // these changes to the loaded files. `selectedFiles` and `loadedFiles` are distinctly
    // different to reduce UI lag when selecting a large quantity of files at once.
    this._disposers.push(
      reaction(
        () => toJS(this._selectedFiles),
        () => {
          const selectedFiles = [...this._selectedFiles.keys()];
          const loadedFiles = [...this._loadedFiles.keys()];

          const filesToLoad = _.difference(selectedFiles, loadedFiles);
          const filesToUnload = _.difference(loadedFiles, selectedFiles);
          console.log("Reaction! Should load:", filesToLoad, "Should unload:", filesToUnload);

          for (const file of filesToLoad) {
            const blameView = this.mainController._repo.getBlame(file);
            const model = new FileModel({
              blameView,
              name: file,
              infos: this._selectedFiles.get(file)!,
            });

            this._loadedFiles.set(file, model);
          }

          for (const file of filesToUnload) {
            this._loadedFiles.get(file)!.dispose();
            this._loadedFiles.delete(file);
          }
          this._loadedFilesArray = [...this._loadedFiles.values()];
          this._selectedFilesKeys = [...selectedFiles];
        },
        { delay: 200 },
      ),
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

  get loadedFiles() {
    return this._loadedFilesArray;
  }

  @computed
  get isDoneEstimatingSize() {
    return !this._loadedFilesArray.some((lf) => lf.isLoading);
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

  @action.bound
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

export type Line = {
  content: string;
  commit?: CommitInfo;
  color?: string;
};

export class FileModel {
  @observable private _blameView: BlameView;
  @observable private _name: string;
  @observable private _infos: FileNodeInfos;
  @observable private _colors: string[] = [];

  @observable private _priority = 0;

  constructor(props: { blameView: BlameView; name: string; infos: FileNodeInfos }) {
    this._blameView = props.blameView;
    this._name = props.name;
    this._infos = props.infos;

    makeObservable(this, undefined, { autoBind: true });
  }

  @action.bound
  dispose() {
    this._blameView.dispose();
  }

  @computed
  get isValid() {
    return (
      this._blameView.blame && this._blameView.blame.lines && this._blameView.blame.lines.length > 0
    );
  }

  @computed
  get isLoading() {
    return this._blameView.loading;
  }

  @computed
  get isPreview() {
    return this._blameView.isPreview;
  }

  get name() {
    return this._name;
  }

  get renderPriority() {
    return this._priority;
  }

  get colors() {
    return this._colors;
  }

  get infos() {
    return this._infos;
  }

  @computed
  get calculatedHeight() {
    return Math.floor(this.data.lines.length / VisualizationDefaults.maxLineCount) + 1 > 1
      ? VisualizationDefaults.maxLineCount * 10
      : this.data.lines.length * 10;
  }

  @computed
  get data() {
    const blame = this._blameView.blame;
    if (!blame) return { lines: [], maxLineLength: 0, earliestTimestamp: 0, latestTimestamp: 0 };

    const { lines, maxLineLength } = parseLines(blame);
    const { earliestTimestamp, latestTimestamp } = parseCommitTimestamps(blame);

    return { lines, maxLineLength, earliestTimestamp, latestTimestamp, isPreview: this.isPreview };
  }

  @action.bound
  setRenderPriority(newPriority: number) {
    this._blameView.setPriority(newPriority);
    this._priority = newPriority;
  }

  @action.bound
  setColors(colors: string[]) {
    this._colors = colors;
  }
}

function parseLines(blame: Blame) {
  let lenMax = 0;
  const lines: Line[] = blame.lines.map((l) => {
    const commit = toJS(blame.commits[l.commitId]);

    lenMax = Math.max(l.content.length, lenMax);
    return {
      content: l.content,
      commit,
    };
  });
  const maxLineLength = Math.min(lenMax, VisualizationDefaults.maxLineLength);

  return { lines, maxLineLength };
}

function parseCommitTimestamps(blame: Blame): {
  earliestTimestamp: number;
  latestTimestamp: number;
} {
  let earliestTimestamp = Number.MAX_SAFE_INTEGER;
  let latestTimestamp = Number.MIN_SAFE_INTEGER;

  for (const commit of Object.values(blame.commits)) {
    earliestTimestamp = Math.min(+commit.timestamp, earliestTimestamp);
    latestTimestamp = Math.max(+commit.timestamp, latestTimestamp);
  }

  return { earliestTimestamp, latestTimestamp };
}

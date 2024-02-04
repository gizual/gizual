import { FinalPayload, ParameterPayloadMap } from "@giz/explorer";
import { Author, Blame, FileTreeNode, GitGraph } from "../types";

import { PoolResponse, PoolTask } from "./types";

export type PortaledJob = {
  id: number;
  priority: number;
  method: string;
  params: any;
  onEnd: (data: any) => void;
  onErr: (err: any) => void;
  onData?: (data: any) => void;
};
export type PortaledJobOpts = {
  id?: number;
  priority?: number;
  method: string;
  params: any;
  onEnd: (data: any) => void;
  onErr: (err: any) => void;
  onData?: (data: any) => void;
};

export type CommitStreamData = {
  oid: string;
  aid: string;
  message: string;

  files: string[];
  timestamp: string;
};

export class JobRef<T> {
  private id_: number;
  private priority_: number;
  private promise_: Promise<T>;
  constructor(
    private portal: PoolPortal,
    job: PortaledJob,
  ) {
    this.id_ = job.id;
    this.priority_ = job.priority ?? 1;

    this.promise_ = new Promise<T>((resolve, reject) => {
      const originalOnEnd = job.onEnd;
      const originalOnErr = job.onErr;

      job.onEnd = (data) => {
        originalOnEnd(data);
        resolve(data);
      };
      job.onErr = (error) => {
        originalOnErr(error);
        reject(error);
      };
    });
  }

  get priority() {
    return this.priority_;
  }

  setPriority(priority: number) {
    this.priority_ = priority;
    this.portal.setJobPriority(this.id_, priority);
  }

  cancel() {
    console.warn("cancel", this.id_);
    this.portal.cancelJob(this.id_);
  }

  get promise() {
    return this.promise_;
  }
}

export class PoolPortal {
  private counter = 0;
  private jobs: PortaledJob[] = [];

  constructor(private port: MessagePort) {
    this.onPortMessage = this.onPortMessage.bind(this);
    this.onPortMessageError = this.onPortMessageError.bind(this);

    port.onmessage = this.onPortMessage;
    port.onmessageerror = this.onPortMessageError;
  }

  dispose() {
    this.sendTask({
      type: "close",
    });

    this.port.close();

    for (const j of this.jobs) {
      j.onErr("Pool closed");
    }

    this.jobs = [];
  }

  onPortMessage(message: MessageEvent<PoolResponse>) {
    const data: PoolResponse = message.data;
    const jobId = data.id;

    const job = this.jobs.find((j) => j.id === jobId);

    if (!job) {
      console.warn("Job not found", jobId);
      return;
    }

    if (!data.end) {
      job.onData?.(data.data);
      return;
    }

    if (message.data.end) {
      this.removeJob(jobId);
    }

    if ("error" in data) {
      job.onErr(data.error);
      return;
    }

    if ("data" in data) {
      job.onEnd(data.data);
    }
  }

  removeJob(jobId: number) {
    const index = this.jobs.findIndex((j) => j.id === jobId);
    if (index !== -1) {
      this.jobs.splice(index, 1);
    }
  }

  onPortMessageError(message: MessageEvent<unknown>) {
    console.error("Port message error", message);
  }

  execute<T>(method: string, params?: any, priority = 100): JobRef<T> {
    const job = {
      id: this.counter++,
      priority,
      params: params ?? {},
      method,
      onEnd: () => {},
      onErr: () => {},
    };

    const ref = new JobRef<T>(this, job);

    this._enqueueJob(job);

    return ref;
  }

  stream(opts: PortaledJobOpts) {
    this._enqueueJob({
      ...opts,
      id: opts.id ?? this.counter++,
      priority: opts.priority ?? 1,
    });
  }

  sendTask(task: PoolTask) {
    this.port.postMessage(task);
  }

  cancelJob(id: number) {
    const job = this.jobs.find((job) => job.id === id);
    if (!job) {
      return;
    }

    this.sendTask({
      type: "remove",
      jobId: job.id,
    });

    job.onErr(new Error("Job cancelled"));

    this.removeJob(id);
  }

  setJobPriority(id: number, priority: number) {
    const job = this.jobs.find((job) => job.id === id);
    if (!job) {
      return;
    }
    job.priority = priority;
    this.sendTask({
      type: "update",
      jobId: job.id,
      priority,
    });
  }

  _enqueueJob(job_: PortaledJobOpts) {
    const id = job_.id ?? this.counter++;
    const priority = job_.priority ?? 1;

    const job = {
      ...job_,
      id,
      priority,
    };

    this.jobs.push(job);

    const ref = new JobRef(this, job);

    this.sendTask({
      type: "new",
      job: {
        id,
        priority,
        method: job.method,
        params: job.params,
      },
    });

    return ref;
  }

  getCommitsForTimeRange(input: ParameterPayloadMap["get_commits_for_time_range"]) {
    return this.execute<FinalPayload<"get_commits_for_time_range">>(
      "get_commits_for_time_range",
      input,
    ).promise;
  }

  setPriority(jobId: number, priority: number) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.priority = priority;
    }
  }

  getBranches(): Promise<string[]> {
    return this.execute<string[]>("get_branches").promise;
  }

  getBlame(params: ParameterPayloadMap["get_blame"], priority?: number): JobRef<Blame> {
    return this.execute<Blame>("get_blame", params, priority ?? 0);
  }

  getFileContent(params: ParameterPayloadMap["get_file_content"]): Promise<string> {
    return this.execute<string>("get_file_content", params).promise;
  }

  getFileTree(params: ParameterPayloadMap["get_file_tree"]) {
    return this.execute<FinalPayload<"get_file_tree">>("get_file_tree", params).promise;
  }

  isValidRev(params: ParameterPayloadMap["is_valid_rev"]) {
    return this.execute<boolean>("is_valid_rev", params).promise;
  }

  getCommit(params: ParameterPayloadMap["get_commit"]) {
    return this.execute<FinalPayload<"get_commit">>("get_commit", params).promise;
  }

  /**
   *
   * @deprecated
   */
  getGitGraph() {
    return this.execute<{ graph: GitGraph }>("get_git_graph").promise;
  }

  /**
   *
   * @deprecated
   */
  streamFileTree(
    branch: string,
    onData: (data: FileTreeNode) => void,
    onEnd: () => void,
    onErr: (err: any) => void,
  ) {
    return this.stream({
      method: "stream_file_tree",
      params: { rev: branch },
      onData,
      onEnd,
      onErr,
    });
  }

  streamCommits(
    onData: (data: CommitStreamData) => void,
    onEnd: () => void,
    onErr: (err: any) => void,
  ) {
    return this.stream({
      method: "stream_commits",
      params: {},
      onData,
      onEnd,
      onErr,
    });
  }

  streamAuthors(onData: (data: Author) => void, onEnd: () => void, onErr: (err: any) => void) {
    return this.stream({
      method: "stream_authors",
      params: {},
      onData,
      onEnd,
      onErr,
    });
  }
}

import path from "node:path";
import fsp from "node:fs/promises";

import simpleGit, { SimpleGitProgressEvent } from "simple-git";
import { EventService } from "./event.service";
import { RepoDescriptor, getRepoSlug } from "@/utils/repo-utils";
import { RuntimeDependencies } from "@/utils/di";

async function exists(p: string): Promise<boolean> {
  return fsp.stat(p).then(
    () => true,
    () => false,
  );
}

export class GitService {
  private eventService: EventService;
  private reposCacheFolder: string;

  constructor(deps: RuntimeDependencies) {
    this.eventService = deps.eventService;
    this.reposCacheFolder = deps.reposCacheFolder;
  }

  async cloneOrUpdateRepo(descr: RepoDescriptor) {
    const { service, org, repo } = descr;
    const repoUrl = `https://${service}.com/${org}/${repo}`;
    const repoSlug = getRepoSlug(descr);

    const progress = ({ total, processed, stage, progress }: SimpleGitProgressEvent) => {
      this.eventService.emit({
        type: "clone-progress",
        repoSlug,
        progress,
        state: stage.replace("remote:", "remote"),
        numProcessed: processed,
        numTotal: total,
      });
    };
    await fsp.mkdir(this.reposCacheFolder, { recursive: true });

    const repoPath = path.join(this.reposCacheFolder, `${service}-${org}-${repo}`);
    if (await exists(path.join(repoPath, "HEAD"))) {
      await simpleGit(repoPath, { progress })
        .remote(["update"])
        .catch((error) => {
          console.error("Error updating repo", error);
          throw error;
        });
      return repoPath;
    }

    let git = simpleGit(undefined, {
      progress,
      baseDir: this.reposCacheFolder,
      config: ["http.emptyAuth=true", "core.askpass=", "credential.helper="],
    });

    git = git.env("GIT_LFS_SKIP_SMUDGE", "1");
    git = git.env("GIT_SSH_COMMAND", "exit 1;"); // disable ssh
    git = git.env("GIT_ASKPASS", "");
    git = git.env("GIT_TERMINAL_PROMPT", "");

    this.eventService.emit({
      type: "clone-start",
      repoSlug,
    });

    await git.clone(repoUrl, repoPath, ["--bare", "--progress"]).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error cloning repo", error);
      }
      throw error;
    });

    this.eventService.emit({
      type: "clone-complete",
      repoSlug,
    });

    return repoPath;
  }
}

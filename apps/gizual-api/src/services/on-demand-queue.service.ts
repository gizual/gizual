import { getRepoSlug, type RepoDescriptor } from "@/utils/repo-utils";
import type { EventService, Event } from "./event.service";
import type { GitService } from "./git.service";
import type { QueueClient } from "@/utils/ssr";
import { SnapshotsService } from "./snapshots.service";
import { RuntimeDependencies } from "@/utils/di";
import _throttle from "lodash/throttle";

export class OnDemandQueue {
  private eventService: EventService;
  private gitService: GitService;
  private snapshotsService: SnapshotsService;
  constructor(deps: RuntimeDependencies) {
    this.eventService = deps.eventService;
    this.gitService = deps.gitService;
    this.snapshotsService = deps.snapshotsService;
    this.handle = this.handle.bind(this);
  }

  async handle(repoDescriptor: RepoDescriptor, client: QueueClient, end: () => void) {
    const slug = getRepoSlug(repoDescriptor);

    const callback = (event: Event) => {
      client.send(event);
    };

    this.eventService.onAny(slug, callback);

    client.on("close", () => {
      this.eventService.offAny(slug, callback);
    });

    try {
      await this.gitService.cloneOrUpdateRepo(repoDescriptor).then((repoPath) => {
        return this.snapshotsService.createSnapshot(repoDescriptor, repoPath);
      });
    } catch (error) {
      this.eventService.emit({
        type: "clone-failed",
        repoSlug: slug,
        error: JSON.stringify(error),
      });
    }
    end();
  }
}

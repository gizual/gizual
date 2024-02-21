import type { EventService } from "@/services/event.service";
import { getRepoSlug } from "@/utils/repo-utils";
import type { Controller, RuntimeDependencies } from "@/utils/di";
import { z } from "zod";

import express from "express";
import { SnapshotsService } from "@/services/snapshots.service";
import { QueueClient } from "@/utils/ssr";
import { OnDemandQueue } from "@/services/on-demand-queue.service";

const CloneParamsSchema = z.object({
  service: z.union([z.literal("github"), z.literal("gitlab"), z.literal("bitbucket")]),
  org: z.string(),
  repo: z.string(),
});

const SNAPSHOT_MAX_AGE = 1000 * 60 * 60 * 24; // 1 day

export class OnDemandCloneController implements Controller {
  router = express.Router();
  eventService: EventService;
  snapshotService: SnapshotsService;
  queue: OnDemandQueue;

  constructor(deps: RuntimeDependencies) {
    this.eventService = deps.eventService;
    this.snapshotService = deps.snapshotsService;
    this.queue = deps.onDemandQueue;
    this.clone = this.clone.bind(this);
    this.router.get("/:service/:org/:repo", this.clone);
  }

  async clone(req: express.Request, res: express.Response) {
    const parsedParams = CloneParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      res.status(400).json(parsedParams.error);
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const client = new QueueClient(res);

    const { service, org, repo } = parsedParams.data;
    const slug = getRepoSlug({ service, org, repo });

    const snapshot = await this.snapshotService.findSnapshot(parsedParams.data, SNAPSHOT_MAX_AGE);

    if (snapshot) {
      client.send({
        type: "snapshot-created",
        repoSlug: slug,
        snapshotName: snapshot.zipName,
      });
      client.end();
      return;
    }

    this.queue.handle(parsedParams.data, client, () => {
      client.end();
    });
  }

  /*
  constructor(router: Router) {
    this.clone = this.clone.bind(this);
    router.get("/clone/:service/:org/:repo", this.clone);
  }
  
  async clone(req: Request, res: Response) {
    const { service, org, repo } = req.params;

    const zip = await getRecentZip(service, org, repo, 1000 * 60 * 60 * 24 * 7);

    if (zip) {
      res.sendFile(zip.zipPath);
      return;
    }

    const zipPath = await createZip(service, org, repo);

    res.sendFile(zipPath);
  }*/
}

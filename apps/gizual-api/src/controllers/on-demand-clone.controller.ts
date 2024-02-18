import type { Controller } from "@/utils/di";

import express from "express";

export class OnDemandCloneController implements Controller {
  router = express.Router();

  constructor() {
    this.clone = this.clone.bind(this);
    this.router.get("/:service/:org/:repo", this.clone);
  }

  async clone(req: express.Request, res: express.Response) {
    throw new Error("Not implemented");
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

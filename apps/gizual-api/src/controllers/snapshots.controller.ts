import express from "express";
import { Controller, RuntimeDependencies } from "@/utils/di";

export class SnapshotsController implements Controller {
  router = express.Router();

  constructor(deps: RuntimeDependencies) {
    const zipsFolder = deps.snapshotsFolder;
    this.router.use(
      express.static(zipsFolder, {
        maxAge: "2d",
        cacheControl: true,
        index: "index.json",
      }),
    );
  }
}

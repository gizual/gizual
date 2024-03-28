import express from "express";
import { Controller, RuntimeDependencies } from "@/utils/di";

export class SnapshotsController implements Controller {
  router = express.Router();

  constructor(deps: RuntimeDependencies) {
    const snapshotsFolder = deps.snapshotsFolder;
    this.router.use(
      express.static(snapshotsFolder, {
        maxAge: "2d",
        cacheControl: true,
        index: "index.json",
      }),
    );
  }
}

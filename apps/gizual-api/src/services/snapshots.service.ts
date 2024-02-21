import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { RepoDescriptor, getRepoSlug } from "@/utils/repo-utils";
import * as archiver from "archiver";
import glob from "fast-glob";
import { EventService } from "./event.service";
import { RuntimeDependencies } from "@/utils/di";

export class SnapshotsService {
  private zipCacheFolder: string;
  private eventService: EventService;
  constructor(deps: RuntimeDependencies) {
    this.eventService = deps.eventService;
    this.zipCacheFolder = deps.zipsCacheFolder;
  }

  async findSnapshot(repoDescriptor: RepoDescriptor, maxAgeMs: number) {
    const pathGlob = this.getUniqueRepoZipName({
      repoDescriptor,
      suffix: "glob",
    });
    let zips = await glob(pathGlob, {
      onlyFiles: true,
      deep: 1,
      stats: true,
      cwd: this.zipCacheFolder,
    });

    zips = zips.sort((a, b) => (a.stats?.mtimeMs || 0) - (b.stats?.mtimeMs || 0));

    const candidate = zips.at(-1);

    if (!candidate) {
      return;
    }

    if (candidate.stats?.mtimeMs && Date.now() - candidate.stats.mtimeMs < maxAgeMs) {
      return {
        zipName: candidate.name,
        zipPath: path.join(this.zipCacheFolder, candidate.name),
        mtimeMs: candidate.stats.mtimeMs,
        stillValidMs: maxAgeMs - (Date.now() - candidate.stats.mtimeMs),
      };
    }

    return undefined;
  }

  async createSnapshot(repoDescriptor: RepoDescriptor, folderPath: string) {
    const zipName = this.getUniqueRepoZipName({
      repoDescriptor,
      suffix: "date",
    });

    const zipPath = path.join(this.zipCacheFolder, zipName);

    if (await exists(zipPath)) {
      console.log("Snapshot already exists", zipPath);
      return zipPath;
    }

    await fsp.mkdir(path.dirname(zipPath), { recursive: true });

    const archive = archiver.create("zip", {});

    const endPromise = new Promise<void>((resolve, reject) => {
      archive.on("end", resolve);
      archive.on("error", reject);
    });

    const output = fs.createWriteStream(zipPath);

    archive.pipe(output);

    // we pack the whole repo (since its --bare) into the zip's .git folder
    archive.directory(folderPath, ".git");

    await archive.finalize();

    await endPromise;
    output.close();

    this.eventService.emit({
      type: "snapshot-created",
      repoSlug: getRepoSlug(repoDescriptor),
      snapshotName: zipName,
    });

    return zipPath;
  }

  getUniqueRepoZipName(props: GetRepoZipNameProps) {
    if (!props.date) props.date = new Date();
    const { service, org, repo } = props.repoDescriptor;
    let suffix = "";
    if (props.suffix === "date") {
      suffix = props.date.getTime().toString();
    } else if (props.suffix === "glob") {
      suffix = "*";
    }

    return `${service}-${org}-${repo}-${suffix}.zip`;
  }

  async cleanOldSnapshots(maxAgeMs: number = 1000 * 60 * 60 * 24 * 2) {
    const zips = await glob(`${this.zipCacheFolder}/*.zip`, {
      onlyFiles: true,
      deep: 1,
      stats: true,
    });
    const toDelete = zips.filter((zip) => Date.now() - zip.stats!.mtimeMs > maxAgeMs);
    return Promise.all(toDelete.map((zip) => fsp.unlink(path.join(this.zipCacheFolder, zip.name))));
  }
}

async function exists(p: string): Promise<boolean> {
  return fsp.stat(p).then(
    () => true,
    () => false,
  );
}

type GetRepoZipNameProps = {
  repoDescriptor: RepoDescriptor;
  date?: Date;
  suffix: "date" | "glob";
};

type Snapshot = {
  zipPath: string;
  mtimeMs: number;
  stillValidMs: number;
};

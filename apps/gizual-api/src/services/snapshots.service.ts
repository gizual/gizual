import fsp from "node:fs/promises";
import path from "node:path";
import { RepoDescriptor, getRepoSlug } from "@/utils/repo-utils";
import glob from "fast-glob";
import { EventService } from "./event.service";
import { RuntimeDependencies } from "@/utils/di";

export class SnapshotsService {
  private snapshotCacheFolder: string;
  private eventService: EventService;
  constructor(deps: RuntimeDependencies) {
    this.eventService = deps.eventService;
    this.snapshotCacheFolder = deps.snapshotsFolder;
  }

  async findSnapshot(repoDescriptor: RepoDescriptor, maxAgeMs: number) {
    const pathGlob = this.getSnapshotName({
      repoDescriptor,
      suffix: "glob",
    });
    let snapshots = await glob(pathGlob, {
      onlyFiles: false,
      onlyDirectories: true,
      deep: 1,
      stats: true,
      cwd: this.snapshotCacheFolder,
    });

    snapshots = snapshots.sort((a, b) => (a.stats?.mtimeMs || 0) - (b.stats?.mtimeMs || 0));

    const candidate = snapshots.at(-1);

    if (!candidate) {
      return;
    }

    if (candidate.stats?.mtimeMs && Date.now() - candidate.stats.mtimeMs < maxAgeMs) {
      return {
        snapshotName: candidate.name,
        snapshotPath: path.join(this.snapshotCacheFolder, candidate.name),
        mtimeMs: candidate.stats.mtimeMs,
        stillValidMs: maxAgeMs - (Date.now() - candidate.stats.mtimeMs),
      };
    }

    return undefined;
  }

  async createSnapshot(repoDescriptor: RepoDescriptor, folderPath: string) {
    const snapshotName = this.getSnapshotName({
      repoDescriptor,
      suffix: "date",
    });

    await fsp.mkdir(this.snapshotCacheFolder, { recursive: true });

    const snapshotPath = path.join(this.snapshotCacheFolder, snapshotName);

    if (await exists(snapshotPath)) {
      console.log("Snapshot already exists", snapshotPath);
      return snapshotPath;
    }

    await fsp.mkdir(snapshotPath, { recursive: true });

    const snapshotFiles = await glob(`**/*`, {
      cwd: folderPath,
      onlyFiles: false,
      markDirectories: true,
      stats: true,
    });

    await fsp.cp(folderPath, snapshotPath, { recursive: true });

    let index: SnapshotIndex = [];

    for (const file of snapshotFiles) {
      if (file.stats!.isFile()) {
        if (file.path.startsWith("hooks/") && file.path.endsWith(".sample")) {
          // we can skip sample hooks
          continue;
        }
        const smallFile = file.stats!.size < 1024 * 2; // 2kb

        let content: string | undefined = undefined;

        if (smallFile) {
          content = await fsp.readFile(path.join(folderPath, file.path), "base64");
        }

        index.push({
          name: file.path,
          size: file.stats!.size,
          content,
        });
      } else {
        index.push({
          name: file.path,
        });
      }
    }

    index = index.sort((a, b) => a.name.length - b.name.length);

    const indexContent = JSON.stringify(index, null, 2);

    await fsp.writeFile(path.join(snapshotPath, "index.json"), indexContent);

    this.eventService.emit({
      type: "snapshot-created",
      repoSlug: getRepoSlug(repoDescriptor),
      snapshotName,
    });

    return snapshotPath;
  }

  getSnapshotName(props: GetRepoSnapshotNameProps) {
    if (!props.date) props.date = new Date();
    const { service, org, repo } = props.repoDescriptor;
    let suffix = "";
    if (props.suffix === "date") {
      suffix = props.date.getTime().toString();
    } else if (props.suffix === "glob") {
      suffix = "*";
    }

    return `${service}-${org}-${repo}-${suffix}`;
  }

  async cleanOldSnapshots(maxAgeMs: number = 1000 * 60 * 60 * 24 * 2) {
    const snapshotDirs = await glob(`*`, {
      onlyDirectories: true,
      onlyFiles: false,
      deep: 1,
      stats: true,
      cwd: this.snapshotCacheFolder,
    });
    const toDelete = snapshotDirs.filter((zip) => Date.now() - zip.stats!.mtimeMs > maxAgeMs);
    return Promise.all(
      toDelete.map((zip) =>
        fsp.rm(path.join(this.snapshotCacheFolder, zip.name), { recursive: true }),
      ),
    );
  }
}

async function exists(p: string): Promise<boolean> {
  return fsp.stat(p).then(
    () => true,
    () => false,
  );
}

type GetRepoSnapshotNameProps = {
  repoDescriptor: RepoDescriptor;
  date?: Date;
  suffix: "date" | "glob";
};

type Snapshot = {
  zipPath: string;
  mtimeMs: number;
  stillValidMs: number;
};

export type SnapshotIndex = SnapshotFile[];

export type SnapshotFile = {
  name: string;
  size?: number;
  content?: string;
};

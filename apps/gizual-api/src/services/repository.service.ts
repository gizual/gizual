import { execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import * as archiver from "archiver";
import { Mutex } from "async-mutex";
import glob from "fast-glob";
import { simpleGit } from "simple-git";
import { RepoDatabase } from "./github.service.js";

const allowedServices = ["github", "gitlab", "bitbucket"] as const;

function isAllowedService(service: string): service is (typeof allowedServices)[number] {
  return allowedServices.includes(service as any);
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

type RepoData = {
  relativePath: string;
  service: string;
  lastUpdated: number;
};

type Config = {
  magicHeader: "gizual-repo-index";
  cachedRepos: RepoData[];
  featuredRepos: string[];
};

type RepoDescriptor = {
  service: "github" | "gitlab" | "bitbucket";
  org: string;
  repo: string;
};

export function getRepoSlug(descr: RepoDescriptor) {
  return `${descr.service}--${descr.org}--${descr.repo}`;
}

export function exists(p: string): Promise<boolean> {
  return fsp.stat(p).then(
    () => true,
    () => false,
  );
}

export function getRepoDescriptorFromURL(url: string): RepoDescriptor | undefined {
  if (url.endsWith(".git")) {
    url = url.slice(0, -4);
  }
  const match = url.match(/https:\/\/(github|gitlab|bitbucket)\.com\/([^/]+)\/([^/]+)\/?/);
  if (!match) {
    return;
  }
  const [_, service, org, repo] = match;

  if (!isAllowedService(service)) {
    return;
  }

  return { service, org, repo };
}

export function descriptorToURL(descr: RepoDescriptor) {
  return `https://${descr.service}.com/${descr.org}/${descr.repo}.git`;
}

const CONFIG_FILE_NAME = "config.json";
/*
class Repo {
  repoPath: string;
  slug: string;
  mutex: Mutex;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async update() {}
}

export class RepoManager {
  cacheDir!: string;
  reposDir!: string;
  zipsDir!: string;

  database: RepoDatabase;

  constructor(cacheDir?: string) {
    if (!cacheDir) {
      cacheDir = path.join(process.cwd(), ".cache");
    }
    this.setCacheDir(cacheDir);
    this.database = new RepoDatabase(path.join(this.cacheDir, "repo-db.json"));
  }

  static async create(cacheDir?: string) {
    const manager = new RepoManager(cacheDir);
    await manager.init();
    return manager;
  }

  setCacheDir(cacheDir: string) {
    this.cacheDir = cacheDir;
    this.reposDir = path.join(this.cacheDir, "repos");
    this.zipsDir = path.join(this.cacheDir, "zips");
  }

  async init() {
    await fsp.mkdir(this.cacheDir, { recursive: true });
    await fsp.mkdir(this.reposDir, { recursive: true });
    await fsp.mkdir(this.zipsDir, { recursive: true });
    await this.loadConfig();
  }

  async loadConfig() {
    const indexFile = path.join(this.cacheDir, CONFIG_FILE_NAME);
    let index: Config;
    try {
      index = JSON.parse(await fsp.readFile(indexFile, "utf8"));
      if (index.magicHeader !== "gizual-repo-index") {
        throw new Error("Invalid index file");
      }
    } catch {
      console.log("Creating new index file");
      index = {
        magicHeader: "gizual-repo-index",
        cachedRepos: [],
        featuredRepos: [],
      };
    }
    return index;
  }

  async writeConfig(index: Config) {
    const indexFile = path.join(this.cacheDir, CONFIG_FILE_NAME);
    await fsp.writeFile(indexFile, JSON.stringify(index, undefined, 2));
  }

  async findZips(descr: RepoDescriptor, maxAgeMs?: number) {
    if (!maxAgeMs) maxAgeMs = Number.MAX_SAFE_INTEGER;
    const slug = getRepoSlug(descr);

    let zips = await glob(`${slug}--*.zip`, {
      onlyFiles: true,
      deep: 1,
      stats: true,
      cwd: this.zipsDir,
    });
    zips = zips.sort((a, b) => (a.stats?.mtimeMs || 0) - (b.stats?.mtimeMs || 0));

    return zips
      .map((zip) => ({
        fullPath: path.join(this.zipsDir, zip.name),
        mtimeMs: zip.stats!.mtimeMs,
        stillValidMs: maxAgeMs! - (Date.now() - zip.stats!.mtimeMs),
      }))
      .filter((zip) => Date.now() - zip.mtimeMs < maxAgeMs!);
  }

  async getCachedRepoZIP(descr: RepoDescriptor, maxAgeMs: number = ONE_DAY_MS) {
    const zips = await this.findZips(descr);
    const candidate = zips.at(-1);

    if (!candidate) {
      return;
    }

    if (candidate.mtimeMs && Date.now() - candidate.mtimeMs < maxAgeMs) {
      return candidate;
    }

    return;
  }

  async ensureRepo(descr: RepoDescriptor) {
    const slug = getRepoSlug(descr);

    const repoPath = path.join(this.reposDir, slug);

    if (await exists(repoPath)) {
      await this.ensureRepo(descr);
    } else {
      await this.cloneRepo(descr);
    }
  }

  async cloneRepo(descr: RepoDescriptor) {
    const slug = getRepoSlug(descr);
    const repoPath = path.join(this.reposDir, slug);
    const git = simpleGit(undefined, {});

    await fsp.mkdir(repoPath, { recursive: true });
    await git.mirror(repoPath, descriptorToURL(descr));

    const index = await this.loadConfig();
  }

  async updateIndex(repo: RepoDescriptor) {
    const index = this.loadConfig();
    index.cachedRepos.push({
      relativePath: getRepoSlug(repo),
      service: repo.service,
      lastUpdated: Date.now(),
    });
    this.writeConfig(index);
  }
}
*/

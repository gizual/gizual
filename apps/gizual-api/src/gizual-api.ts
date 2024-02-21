import express from "express";
import { Constructor, Controller, Runtime } from "@/utils/di";
import { GitService } from "@/services/git.service";
import { ConfigService } from "@/services/config.service";

import { ErrorHandlerMiddleware } from "@/middlewares/error-handler.middleware";
import { OnDemandCloneController } from "./controllers/on-demand-clone.controller";

export function createApp(): express.Router {
  const runtime = new Runtime();
  const router = express.Router();

  function registerController<T extends Controller>(prefix: string, ctor: Constructor<T>) {
    const instance = runtime.container.build(ctor);
    router.use(prefix, instance.router);
  }

  runtime.registerClass("configService", ConfigService);
  runtime.registerClass("gitService", GitService);

  registerController("/on-demand-clone", OnDemandCloneController);

  //new CloneController(router);
  router.get("/", async (req, res) => {
    res.send("Hello World");
  });

  router.use(ErrorHandlerMiddleware);

  return router;
}

/*
import { execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import * as archiver from "archiver";
import express, { Express, Request, Response } from "express";
import glob from "fast-glob";
import { simpleGit, SimpleGitProgressEvent } from "simple-git";

const allowedServices = new Set(["github", "gitlab", "bitbucket"]);

const rootDir = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();

const globalRepoCacheFolder = path.join(rootDir, ".cache", "api", "repos");
const globalZipCacheFolder = path.join(rootDir, ".cache", "api", "zips");

console.log("Cache folder:", globalRepoCacheFolder);

const app: Express = express();
const port = 5172;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

function getUniqueRepoZipName(service: string, org: string, repo: string, date?: Date) {
  if (!date) date = new Date();

  return `${service}-${org}-${repo}-${date.getTime()}.zip`;
}

type GetRecentZipResult = {
  zipPath: string;
  mtimeMs: number;
  stillValidMs: number;
};

async function getRecentZip(
  service: string,
  org: string,
  repo: string,
  maxAge: number,
): Promise<GetRecentZipResult | undefined> {
  const folderPath = path.join(globalZipCacheFolder, service, org, repo);

  let zips = await glob(`*.zip`, { onlyFiles: true, deep: 1, stats: true, cwd: folderPath });

  zips = zips.sort((a, b) => (a.stats?.mtimeMs || 0) - (b.stats?.mtimeMs || 0));

  const candidate = zips.at(-1);

  if (!candidate) {
    return;
  }

  if (candidate.stats?.mtimeMs && Date.now() - candidate.stats.mtimeMs < maxAge) {
    return {
      zipPath: path.join(folderPath, candidate.name),
      mtimeMs: candidate.stats.mtimeMs,
      stillValidMs: maxAge - (Date.now() - candidate.stats.mtimeMs),
    };
  }

  return undefined;
}

async function createZip(service: string, org: string, repo: string) {
  const repoPath = path.join(globalRepoCacheFolder, service, org, repo);
  const zipFolderPath = path.join(globalZipCacheFolder, service, org, repo);

  const zipName = getUniqueRepoZipName(service, org, repo);

  const zipPath = path.join(zipFolderPath, zipName);

  if (await fsp.stat(zipPath).catch(() => false)) {
    return zipPath;
  }

  await fsp.mkdir(zipFolderPath, { recursive: true });

  const archive = archiver.create("zip", {});

  const endPromise = new Promise<void>((resolve, reject) => {
    archive.on("end", resolve);
    archive.on("error", reject);
  });

  const output = fs.createWriteStream(zipPath);

  archive.pipe(output);

  // we pack the whole repo (since its --bare) into the zip's .git folder
  archive.directory(repoPath, ".git");

  await archive.finalize();

  await endPromise;
  output.close();

  return zipPath;
}

async function cloneOrUpdateRepo(service: string, org: string, repo: string) {
  const repoUrl = `https://${service}.com/${org}/${repo}`;

  const progress = ({ method, stage, progress }: SimpleGitProgressEvent) => {
    console.log(`git.${method} "${stage}" stage ${progress}% complete`);
  };

  const repoPath = path.join(globalRepoCacheFolder, service, org, repo);
  if (fs.existsSync(path.join(repoPath, "HEAD"))) {
    await simpleGit(repoPath, { progress })
      .remote(["update"])
      .catch((error) => {
        console.error("Error updating repo", error);
        throw error;
      });
    return;
  }

  await fsp.mkdir(repoPath, { recursive: true });
  let git = simpleGit(undefined, { progress });

  // disable any git-lfs downloads
  git = git.env("GIT_LFS_SKIP_SMUDGE", "1");

  await git.clone(repoUrl, repoPath, ["--bare", "--progress"]).catch((error) => {
    console.error("Error cloning repo", error);
    throw error;
  });
}

app.route("/clone/:service/:org/:repo").get(async (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { service, org, repo } = req.params;

  if (!allowedServices.has(service)) {
    res.status(404).send(`Service ${service} not found`);
    return;
  }

  // maxAge of 24h
  const maxAge = 24 * 60 * 60 * 1000;
  const cachedZip = await getRecentZip(service, org, repo, maxAge);
  if (cachedZip) {
    console.log("Returning cached zip", cachedZip);
    
    res.header(
      "Cache-Control",
      `public, max-age=${Math.round(cachedZip.stillValidMs / 1000)}, immutable`,
    );
    
    res.sendFile(cachedZip.zipPath, {
      cacheControl: false,
      etag: false,
    });
    return;
  }

  await cloneOrUpdateRepo(service, org, repo);

  const zipPath = await createZip(service, org, repo);
  console.log("Created zip", zipPath);
  //res.header("Cache-Control", `public, max-age=${Math.round(maxAge / 1000)}, immutable`);
  res.sendFile(zipPath, {
    cacheControl: false,
    etag: false,
  });
});

app.listen(port, () => {
  console.log(`Backend-Server is running at http://localhost:${port}`);
});
*/

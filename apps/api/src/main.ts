import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as archiver from "archiver";
import express, { Express, Request, Response } from "express";
import { simpleGit } from "simple-git";

const allowedServices = new Set(["github", "gitlab", "bitbucket"]);

const rootDir = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();

const cacheFolder = path.join(rootDir, ".cache", "api");

console.log("Cache folder:", cacheFolder);

const app: Express = express();
const port = 5172;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

async function returnZippedRepo(res: Response, service: string, org: string, repo: string) {
  const cachePath = path.join(cacheFolder, service, org, repo);

  if (!fs.existsSync(cachePath)) {
    res.status(404).send(`Repo ${repo} not found`);
    return;
  }

  const archive = archiver.create("zip", {});

  archive.on("error", function (err) {
    res.status(500).send({ error: err.message });
  });

  res.on("close", function () {
    console.log("Archive wrote %d bytes", archive.pointer());
    res.end();
  });

  //set the archive name
  res.attachment(`${repo}.zip`);

  //this is the streaming magic
  archive.pipe(res);

  archive.directory(path.join(cachePath, ".git"), ".git");

  await archive.finalize();
}

app.route("/clone/:service/:org/:repo").get(async (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { service, org, repo } = req.params;

  if (!allowedServices.has(service)) {
    res.status(404).send(`Service ${service} not found`);
    return;
  }

  const repoUrl = `https://${service}.com/${org}/${repo}`;

  const repoPath = path.join(cacheFolder, service, org, repo);
  try {
    if (fs.existsSync(repoPath)) {
      await simpleGit(repoPath).pull();
      await returnZippedRepo(res, service, org, repo);
      return;
    }

    const git = simpleGit();

    await git.clone(repoUrl, repoPath);
  } catch (error: any) {
    console.error(error);
    res.status(500).send(error.message);
    return;
  }

  await returnZippedRepo(res, service, org, repo);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

import fsp from "node:fs/promises";

const allowedServices = ["github", "gitlab", "bitbucket"] as const;

function isAllowedService(service: string): service is (typeof allowedServices)[number] {
  return allowedServices.includes(service as any);
}

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

export type RepoDescriptor = {
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

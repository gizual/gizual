import fsp from "node:fs/promises";

import { Mutex } from "async-mutex";
import zod from "zod";

const RepoSchema = zod.object({
  slug: zod.string(),
  url: zod.string(),
  lastUpdated: zod.number(),
  dirty: zod.optional(zod.boolean()),
});

export type Repo = zod.infer<typeof RepoSchema>;
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

const RepoIndexSchema = zod.object({
  repositories: zod.array(RepoSchema),
});

export type RepoIndex = zod.infer<typeof RepoIndexSchema>;

export class RepoDatabase {
  filePath: string;
  mutex = new Mutex();
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async load() {
    return this.mutex.runExclusive(async () => {
      return await this.loadUnsafe();
    });
  }

  async store(index: RepoIndex) {
    return this.mutex.runExclusive(async () => {
      return await this.storeUnsafe(index);
    });
  }

  async updateRepo(data: Optional<Repo, "dirty" | "lastUpdated">) {
    return this.mutex.runExclusive(async () => {
      const index = await this.loadUnsafe();
      const existingIndex = index.repositories.findIndex(
        (r) => r.slug === data.slug && r.url === data.url,
      );
      if (existingIndex === -1) {
        index.repositories.push({
          lastUpdated: 0,
          ...data,
        });
      } else {
        index.repositories[existingIndex] = {
          ...index.repositories[existingIndex],
          ...data,
        };
      }
      await this.storeUnsafe(index);
    });
  }

  private async loadUnsafe(): Promise<zod.infer<typeof RepoIndexSchema>> {
    const file = await fsp.readFile(this.filePath, "utf8");
    const index = JSON.parse(file);
    return RepoIndexSchema.parse(index);
  }

  private async storeUnsafe(index: zod.infer<typeof RepoIndexSchema>) {
    await fsp.writeFile(this.filePath, JSON.stringify(index, undefined, 2));
  }
}

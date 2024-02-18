import path from "node:path";

export type Config = {
  maxAge: number;
  featuredRepos: string[];
  cacheDir: string;
};

export class ConfigService {
  private config!: Config;

  constructor() {
    let cacheDir = process.env.GIZUAL_CACHE_DIR;

    if (!cacheDir) {
      cacheDir = path.join(process.cwd(), ".cache", "api");
    }

    // TODO: probably load config from file and validate with zod
    this.config = {
      maxAge: 1000 * 60 * 60 * 24,
      featuredRepos: [
        "https://github.com/freeCodeCamp/freeCodeCamp",
        "https://github.com/facebook/react",
        "https://github.com/vuejs/vue",
        "https://github.com/tensorflow/tensorflow",
        "https://github.com/flutter/flutter",
        "https://github.com/golang/go",
        "https://github.com/home-assistant/core",
      ],
      cacheDir,
    };
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }
}

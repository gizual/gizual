#!/usr/bin/env vite-node --script

import fsp from "node:fs/promises";
import path from "node:path";
import { findRoot } from "@manypkg/find-root";
import { getPackages, Package } from "@manypkg/get-packages";
import chalk from "chalk";
import chokidar from "chokidar";
import concurrently, { type ConcurrentlyCommandInput } from "concurrently";
import { debounce } from "debounce";

const COLORS = ["green", "yellow", "blue", "magenta", "cyan"];

function randomColors(num: number) {
  const res: string[] = [];

  for (let i = 0; i < num; i++) {
    res.push(COLORS[i % COLORS.length]);
  }

  return res;
}

function log(...args: any[]) {
  console.log(chalk.red("LOG:"), ...args);
}

async function fspExists(path: string): Promise<boolean> {
  try {
    await fsp.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findNearestPackage(dir: string): Promise<Package> {
  const exists = await fspExists(path.join(dir, "package.json"));

  if (!exists) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error("No package.json found");
    }
    return await findNearestPackage(parent);
  }

  const packageJson = JSON.parse(await fsp.readFile(path.join(dir, "package.json"), "utf8"));

  return {
    dir,
    packageJson,
    relativeDir: path.relative(process.cwd(), dir),
  };
}

export type TaskConfig = {
  env?: Record<string, string>;
  dependsOn?: string[];
  input?: string | string[];
  output?: string | string[];
};

export type Task = {
  id: string;
  pkg: Package;
  taskName: string;
  env: Record<string, string>;
  dependsOn: string[];
  input?: string[] | undefined;
  output?: string[] | undefined;
  transparent?: boolean;
};

class DependencyGraph {
  tasks: Task[] = [];

  watchers: chokidar.FSWatcher[] = [];
  disposers: (() => void)[] = [];

  constructor(
    public rootDir: string,
    public packages: Package[],
  ) {}

  static async create(cwd: string) {
    const root = await findRoot(cwd);
    const { packages: allPackages } = await getPackages(root.rootDir);

    return new DependencyGraph(root.rootDir, allPackages);
  }

  async addTask(pkg: Package, taskName: string): Promise<string | undefined> {
    const packageJSON: any = pkg.packageJson;
    const id = `${packageJSON.name}#${taskName}`;

    if (this.tasks.some((t) => t.id === id)) {
      return id;
    }

    const script = packageJSON.scripts?.[taskName];
    const infoDTO: TaskConfig = packageJSON.please?.[taskName];

    if (!script && !infoDTO) {
      return undefined;
    }

    const task: Task = {
      id,
      pkg,
      taskName,
      env: {},
      dependsOn: [],
    };
    this.tasks.push(task);

    if (!script) {
      task.transparent = true;
    }

    if (infoDTO?.input) {
      task.input = typeof infoDTO.input === "string" ? [infoDTO.input] : infoDTO.input;
    }

    if (infoDTO?.output) {
      task.output = typeof infoDTO.output === "string" ? [infoDTO.output] : infoDTO.output;
    }

    if (infoDTO?.env) {
      task.env = infoDTO.env;
    }

    const dependencies: Record<string, string> = {
      ...pkg.packageJson.devDependencies,
      ...pkg.packageJson.dependencies,
    };

    const workspaceDependencies = Object.entries(dependencies)
      .filter(([_, value]) => value.startsWith("workspace:"))
      .filter(([key, _]) => key !== "@giz/please");

    const dependencyPackages: Package[] = [];

    for (const [key, _] of workspaceDependencies) {
      if (!this.packageExists(key)) {
        throw new Error(`Package ${key} not found`);
      }
      dependencyPackages.push(this.getPackage(key));
    }

    const dependsOn = infoDTO?.dependsOn || [];
    const distinctSubTaskNames = dependsOn.filter((entry) => entry.includes("#"));

    const globalSubTaskNames = dependsOn.filter((entry) => !entry.includes("#"));

    for (const name of globalSubTaskNames) {
      for (const dependencyPackage of dependencyPackages) {
        const subtaskId = await this.addTask(dependencyPackage, name);
        if (subtaskId) task.dependsOn.push(subtaskId);
      }
    }

    for (const entry of distinctSubTaskNames) {
      const [dependencyName, dependencyTaskName] = entry.split("#");

      const dependencyPackage = this.getPackage(dependencyName);
      const subtaskId = await this.addTask(dependencyPackage, dependencyTaskName);
      if (subtaskId) task.dependsOn.push(subtaskId);
    }

    return id;
  }

  sortTasks() {
    const sortedTasks: Task[] = [];

    const tasks = [...this.tasks];

    let MAX_ITERATIONS = Math.pow(tasks.length, 2);

    while (tasks.length > 0 && MAX_ITERATIONS-- > 0) {
      const task = tasks.shift()!;

      if (task.dependsOn.every((id) => sortedTasks.some((t) => t.id === id))) {
        sortedTasks.push(task);
      } else {
        tasks.push(task);
      }
    }

    if (MAX_ITERATIONS <= 0 && tasks.length > 0) {
      log("Problematic tasks:", tasks);
      throw new Error("Circular dependency detected");
    }

    this.tasks = sortedTasks;
  }

  async execute(originalTaskIds: string[]) {
    const tasks = this.tasks
      .filter((task) => !task.transparent)
      .filter((task) => !originalTaskIds.includes(task.id));

    for (const task of tasks) {
      await this.runTask([task]);
    }

    const watchTasks = this.tasks.filter((task) => task.input);

    for (const task of watchTasks) {
      this.setupWatchTask(task);
    }

    const t = this.tasks.filter((task) => originalTaskIds.includes(task.id));

    return this.runTask(t);
  }

  async runTask(tasks: Task[], prefixColor?: string) {
    if (tasks.length === 0) {
      throw new Error("No tasks provided");
    }

    if (tasks.length <= 1 && !prefixColor) {
      prefixColor = "gray";
    }

    const commands: ConcurrentlyCommandInput[] = [];

    const colors = randomColors(tasks.length);

    const ids: string[] = [];

    for (const [i, task] of tasks.entries()) {
      const prettyTaskId = `${chalk.blue(task.pkg.packageJson.name)}#${chalk.yellow(
        task.taskName,
      )}`;

      ids.push(prettyTaskId);

      const { pkg, taskName, env } = task;
      const packageJSON: any = pkg.packageJson;
      const script = packageJSON.scripts?.[taskName];

      if (!script) {
        throw new Error(`No script found for task ${prettyTaskId}`);
      }

      commands.push({
        command: `yarn run ${taskName}`,
        name: `${pkg.packageJson.name}#${taskName}`,
        cwd: pkg.dir,
        prefixColor: prefixColor || colors[i],
        env: {
          ...process.env,
          ...env,
        },
      });
    }

    log(`Running tasks ${ids.join(", ")}`);

    const res = concurrently(commands, {
      killOthers: ["failure", "success"],
      restartTries: 0,
    });

    const disposer = () => {
      for (const c of res.commands) {
        c.kill();
      }
    };

    this.disposers.push(disposer);

    await res.result;

    this.disposers = this.disposers.filter((d) => d !== disposer);

    log(`Finished tasks ${ids.join(", ")}`);
  }

  setupWatchTask(task: Task) {
    const debouncedRunTask = debounce(
      (filePath) => {
        log(`change detected for ${task.id}: ${filePath}`);
        this.runTask([task]);
      },
      500,
      false,
    );

    const watchJob = chokidar
      .watch(task.input!, {
        cwd: task.pkg.dir,
      })
      .on("change", debouncedRunTask);

    this.watchers.push(watchJob);
  }

  packageExists(name: string): boolean {
    return this.packages.some((p) => p.packageJson.name === name);
  }

  getPackage(name: string): Package {
    const pkg = this.packages.find((p) => p.packageJson.name === name);
    if (!pkg) {
      throw new Error(`Package ${name} not found`);
    }
    return pkg;
  }

  dispose(error?: boolean) {
    for (const watcher of this.watchers) {
      watcher.close();
    }

    for (const disposer of this.disposers) {
      disposer();
    }

    this.disposers = [];
    this.watchers = [];
    this.tasks = [];
    this.packages = [];

    process.exit(error ? 1 : 0);
  }
}

const main = async () => {
  const graph = await DependencyGraph.create(process.cwd());

  const otherArgs = process.argv.slice(2);

  if (otherArgs.length === 0) {
    throw new Error("No task names provided");
  }

  const primaryTasks: string[] = [];

  for (const arg of otherArgs) {
    let pkg: Package | undefined;
    let taskName: string | undefined;
    if (arg.includes("#")) {
      const [pkgName, tName] = arg.split("#");
      taskName = tName;
      pkg = graph.getPackage(pkgName);
    } else {
      pkg = await findNearestPackage(process.cwd());
      taskName = arg;
    }
    const id = await graph.addTask(pkg, taskName);

    if (!id) {
      throw new Error(`Task ${arg} not found`);
    }

    primaryTasks.push(id);
  }

  graph.sortTasks();

  process.on("SIGINT", () => {
    graph.dispose(true);
  });

  process.on("SIGTERM", () => {
    graph.dispose(true);
  });

  process.on("exit", () => {
    graph.dispose();
  });

  graph.execute(primaryTasks).then(() => {
    log("All tasks are done 🔥");
    graph.dispose();
  });
};

await main();

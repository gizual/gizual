#!/usr/bin/env vite-node --script

import fsp from "node:fs/promises";
import path from "node:path";
import { findRoot } from "@manypkg/find-root";
import { getPackages, Package } from "@manypkg/get-packages";
import chalk from "chalk";
import chokidar from "chokidar";
import concurrently from "concurrently";
import { debounce } from "debounce";

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
  dependsOn?: string[];
  input?: string | string[];
  output?: string | string[];
};

export type Task = {
  id: string;
  pkg: Package;
  taskName: string;
  dependsOn: string[];
  input?: string[] | undefined;
  output?: string[] | undefined;
  transparent?: boolean;
};

class DependencyGraph {
  tasks: Task[] = [];

  watchers: chokidar.FSWatcher[] = [];

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

  async execute(originalTaskId: string) {
    const tasks = this.tasks
      .filter((task) => !task.transparent)
      .filter((task) => task.id !== originalTaskId);

    for (const task of tasks) {
      await this.runTask(task);
    }

    const watchTasks = this.tasks.filter((task) => task.input);

    for (const task of watchTasks) {
      this.setupWatchTask(task);
    }

    const t = this.tasks.find((task) => task.id === originalTaskId);

    if (!t) {
      throw new Error(`Task ${originalTaskId} not found`);
    }

    return this.runTask(t, "green");
  }

  async runTask(task: Task, prefixColor = "gray") {
    const prettyTaskId = `${chalk.blue(task.pkg.packageJson.name)}#${chalk.yellow(task.taskName)}`;
    const { pkg, taskName } = task;
    const packageJSON: any = pkg.packageJson;
    const script = packageJSON.scripts?.[taskName];

    if (!script) {
      throw new Error(`No script found for task ${prettyTaskId}`);
    }

    log(`Running task ${prettyTaskId}`);

    const res = concurrently(
      [
        {
          command: `yarn run ${taskName}`,
          name: `${pkg.packageJson.name}#${taskName}`,
          cwd: pkg.dir,
          prefixColor,
        },
      ],
      {
        killOthers: ["failure", "success"],
        restartTries: 0,
      },
    );

    await res.result;
    log(`Finished task ${chalk.blue(prettyTaskId)}`);
  }

  setupWatchTask(task: Task) {
    const debouncedRunTask = debounce(
      (filePath) => {
        log(`change detected for ${task.id}: ${filePath}`);
        this.runTask(task);
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

  dispose() {
    for (const watcher of this.watchers) {
      watcher.close();
    }

    this.watchers = [];
    this.tasks = [];
    this.packages = [];
  }
}

const main = async () => {
  const graph = await DependencyGraph.create(process.cwd());

  const arg2 = process.argv[2];

  if (!arg2) {
    throw new Error("No task name provided");
  }

  let pkg: Package | undefined;
  let taskName: string | undefined;
  if (arg2.includes("#")) {
    const [pkgName, tName] = arg2.split("#");
    taskName = tName;
    pkg = graph.getPackage(pkgName);
  } else {
    pkg = await findNearestPackage(process.cwd());
    taskName = arg2;
  }

  const id = await graph.addTask(pkg, taskName);

  graph.sortTasks();

  process.on("SIGINT", () => {
    graph.dispose();
  });

  process.on("SIGTERM", () => {
    graph.dispose();
  });

  process.on("exit", () => {
    graph.dispose();
  });

  graph.execute(id!).then(() => {
    log("All tasks are done 🔥");
    graph.dispose();
  });
};

await main();

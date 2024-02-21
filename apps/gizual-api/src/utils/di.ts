import type { Router } from "express";
import * as awilix from "awilix";
import type { GitService } from "@/services/git.service";
import type { ConfigService } from "@/services/config.service";
import type { SnapshotsService } from "@/services/snapshots.service";
import type { OnDemandQueue } from "@/services/on-demand-queue.service";
import type { EventService } from "@/services/event.service";

export type Constructor<T> = awilix.Constructor<T>;

export interface Controller {
  router: Router;
}

export interface RuntimeDependencies {
  gitService: GitService;
  configService: ConfigService;
  snapshotsService: SnapshotsService;
  onDemandQueue: OnDemandQueue;
  eventService: EventService;
  reposCacheFolder: string;
  zipsCacheFolder: string;
}

export class Runtime {
  container: awilix.AwilixContainer;
  constructor() {
    this.container = awilix.createContainer({
      injectionMode: awilix.InjectionMode.PROXY,
      strict: true,
    });
  }

  registerClass<K extends keyof RuntimeDependencies>(
    name: K,
    value: Constructor<RuntimeDependencies[K]>,
  ) {
    this.container.register({
      [name]: awilix.asClass(value).setLifetime(awilix.Lifetime.SINGLETON),
    });
  }

  registerValue<K extends keyof RuntimeDependencies>(name: K, value: RuntimeDependencies[K]) {
    this.container.register({
      [name]: awilix.asValue(value),
    });
  }

  registerFactory<K extends keyof RuntimeDependencies>(
    name: K,
    value: awilix.FunctionReturning<RuntimeDependencies[K]>,
  ) {
    this.container.register({
      [name]: awilix.asFunction(value).setLifetime(awilix.Lifetime.SINGLETON),
    });
  }

  resolve<K extends keyof RuntimeDependencies>(name: K): RuntimeDependencies[K] {
    return this.container.resolve(name);
  }
}

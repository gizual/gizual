import express from "express";
import cron from "node-cron";
import cors from "cors";
import compression from "compression";

// This is required to handle async errors in express
import "express-async-errors";
import { RateLimitMiddleware, RateSlowDownMiddleware } from "./middlewares/rate-limit.middleware";
import { Constructor, Controller, Runtime } from "./utils/di";
import { ConfigService } from "./services/config.service";
import { GitService } from "./services/git.service";
import { OnDemandCloneController } from "./controllers/on-demand-clone.controller";
import { ErrorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { SnapshotsService } from "./services/snapshots.service";
import { OnDemandQueue } from "./services/on-demand-queue.service";
import { EventService } from "./services/event.service";
import { SnapshotsController } from "./controllers/snapshots.controller";

const isProduction = process.env.NODE_ENV !== "development";

const app: express.Express = express();

app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
});

app.disable("x-powered-by");

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 5172;
const proxyCount = process.env.PROXY_COUNT ? Number.parseInt(process.env.PROXY_COUNT) : 0;
app.set("trust proxy", proxyCount);

const apiRouter = express.Router();

apiRouter.use(
  cors({
    origin: ["https://app.gizual.com", "http://localhost:5173", "http://localhost:4173"],
  }),
);

if (isProduction) {
  apiRouter.use(RateLimitMiddleware);
  apiRouter.use(RateSlowDownMiddleware);
}

const cwd = process.cwd();

const globalRepoCacheFolder = process.env.REPO_CACHE_FOLDER || `${cwd}/.cache/api/repos`;
const globalSnapshotCacheFolder =
  process.env.SNAPSHOT_CACHE_FOLDER || `${cwd}/.cache/api/snapshots`;

const runtime = new Runtime();

function registerController<T extends Controller>(prefix: string, ctor: Constructor<T>) {
  const instance = runtime.container.build(ctor);
  apiRouter.use(prefix, instance.router);
}

runtime.registerValue("reposCacheFolder", globalRepoCacheFolder);
runtime.registerValue("snapshotsFolder", globalSnapshotCacheFolder);
runtime.registerClass("snapshotsService", SnapshotsService);
runtime.registerClass("eventService", EventService);
runtime.registerClass("onDemandQueue", OnDemandQueue);
runtime.registerClass("configService", ConfigService);
runtime.registerClass("gitService", GitService);

registerController("/on-demand-clone", OnDemandCloneController);
registerController("/snapshots", SnapshotsController);

apiRouter.get("/", async (_, res) => {
  res.status(200).send({ success: true });
});

app.use("/api", apiRouter);

if (isProduction) {
  app.use(compression());
  app.use(
    express.static("public", {
      cacheControl: true,
    }),
  );
}

app.use(ErrorHandlerMiddleware);

cron.schedule(
  "0 0 * * *",
  async () => {
    const snapshotsService = runtime.resolve("snapshotsService");
    await snapshotsService.cleanOldSnapshots();
  },
  {
    name: "clean-old-snapshots",
    runOnInit: true,
  },
);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

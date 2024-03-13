import { getGlobalState } from "@giz/logging";

/**
 * A GizWorker is a WebWorker with some additional functionality
 * focused on logging. It exposes the logging level and filter
 * to the worker, and sets the worker's name as appropriate.
 */
export class GizWorker extends Worker {
  name: string;

  constructor(url: string | URL, options?: WorkerOptions) {
    const urlObj = new URL(url.toString(), `${location.origin}`);
    const pathName = urlObj.pathname;
    const fileName = pathName.substring(pathName.lastIndexOf("/") + 1);
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

    let name = "";

    if (options && options.name) {
      name = options.name;
    } else {
      name = fileNameWithoutExt;
    }
    const globalState = getGlobalState();

    name = [globalState.prefix, name].filter(Boolean).join("::");

    urlObj.searchParams.set("name", name);

    urlObj.searchParams.set("logLevel", globalState.maxLevel);
    urlObj.searchParams.set("logFilter", globalState.filter.join(","));
    urlObj.searchParams.set("logChannelId", globalState.id);

    super(urlObj, options);

    this.name = name;
  }

  terminate(): void {
    super.terminate();
  }
}

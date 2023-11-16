import { action, makeAutoObservable, observable } from "mobx";

import { FileLoaderLocal, FileLoaders } from "@giz/maestro/react";

import _local from "./content/local.json";
import { Content } from "./content/type";
import _url from "./content/url.json";
import _zip from "./content/zip.json";

const local: Content = _local;
const zip: Content = _zip;
const url: Content = _url;

export type AdvancedConfigurationSelection = "fsa" | "html" | "drag";

export type RepoMetrics = {
  stars: number;
  forks: number;
};
export type RepoSource = "url" | "zip" | "local";
export type SupportedBy = "chromium" | "firefox" | "safari" | "ios" | "android";

export class WelcomeViewModel {
  @observable selectedFileLoaderConfig: AdvancedConfigurationSelection = "fsa";
  constructor() {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  @action
  setSelectedFileLoaderConfig(config: AdvancedConfigurationSelection) {
    this.selectedFileLoaderConfig = config;
  }
}

export function prepareFileLoaderLocal(
  loaders: FileLoaderLocal[],
  config: AdvancedConfigurationSelection,
) {
  switch (config) {
    case "fsa": {
      return loaders.find((l) => l.id === "fsa");
    }
    case "html": {
      return loaders.find((l) => l.id === "input-field");
    }
    case "drag": {
      return loaders.find((l) => l.id === "drag-and-drop");
    }
  }
}

export function mapSourceToContent(source?: RepoSource): Content | undefined {
  switch (source) {
    case "local": {
      return local;
    }
    case "url": {
      return url;
    }
    case "zip": {
      return zip;
    }
  }

  return;
}

export function prepareSelectedLoaders(loaders: FileLoaders, source?: RepoSource) {
  switch (source) {
    case "local": {
      return loaders.local;
    }
    case "url": {
      return loaders.url;
    }
    case "zip": {
      return loaders.zip;
    }
  }

  return loaders.local;
}

export function showFilePicker(type: "directory" | "zip" = "directory") {
  const input = document.createElement("input");
  input.style.display = "none";
  input.style.visibility = "hidden";
  input.type = "file";
  if (type === "directory") {
    //input.multiple = true;
    input.webkitdirectory = true;
  } else {
    input.accept = ".zip";
  }

  document.body.append(input);

  const remove = () => {
    try {
      input.remove();
    } catch {
      // noop
    }
  };

  const promise = new Promise<FileList>((resolve, reject) => {
    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        resolve(input.files);
      } else {
        reject("No files selected");
      }

      remove();
    };

    input.oncancel = () => {
      reject("User cancelled");
      remove();
    };
  });
  input.click();
  return promise;
}

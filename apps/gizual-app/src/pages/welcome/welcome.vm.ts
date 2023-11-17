import { action, makeAutoObservable, observable } from "mobx";

import { FileLoaderLocal, FileLoaders } from "@giz/maestro/react";

export type AdvancedConfigurationSelection = "fsa" | "input-field" | "drag-and-drop";

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

export function getLoaderForConfig(
  loaders: FileLoaderLocal[],
  config: AdvancedConfigurationSelection,
) {
  return loaders.find((l) => l.id === config);
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

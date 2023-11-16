import { CreateTRPCReact } from "@trpc/react-query";
import React from "react";

import { CommitInfo } from "@giz/explorer-web";
import type { Maestro } from "../maestro";
import type { AppRouter } from "../maestro-worker";

import { MaestroContext, TrpcContext } from "./providers";

function isSupportedBrowser() {
  return "showDirectoryPicker" in window;
}

export function useTrpc(): CreateTRPCReact<AppRouter, unknown, ""> {
  return React.useContext(TrpcContext);
}

export function useMaestro(): Maestro {
  return React.useContext(MaestroContext);
}

export function useAuthorList(limit?: number, offset?: number) {
  const trpc = useTrpc();

  return trpc.authorList.useQuery({ limit, offset });
}

export type FileLoaderDragAndDrop = {
  id: "drag-and-drop";
  load: (file: FileSystemDirectoryEntry) => void;
};

// Tauri only
export type FileLoaderNativeFilePicker = {
  id: "native-file-picker";
  openFilePicker: () => void;
};

export type FileLoaderInputField = {
  id: "input-field";
  load: (file: FileList) => void;
};

export type FileLoaderFSA = {
  id: "fsa";
  load: (handle: FileSystemDirectoryHandle) => void;
};

export type FileLoaderZipFile = {
  id: "zip-file";
  load: (file: File) => void;
};

export type FileLoaderUrl = {
  id: "url";
  load: (url: string) => void;
};

export type FileLoader =
  | FileLoaderNativeFilePicker
  | FileLoaderFSA
  | FileLoaderDragAndDrop
  | FileLoaderInputField
  | FileLoaderZipFile
  | FileLoaderUrl;

export function useFileLoaders(): FileLoader[] {
  const maestro = useMaestro();

  const loaders: FileLoader[] = [];

  const fsaCallback = React.useCallback(
    (directoryHandle: FileSystemDirectoryHandle) => {
      maestro.openRepo({ directoryHandle });
    },
    [maestro],
  );

  const inputFieldCallback = React.useCallback(
    (fileList: FileList) => {
      maestro.openRepo({ fileList });
    },
    [maestro],
  );

  const zipFileCallback = React.useCallback(
    (zipFile: File) => {
      maestro.openRepo({ zipFile });
    },
    [maestro],
  );

  const dragAndDropCallback = React.useCallback(
    (directoryEntry: FileSystemDirectoryEntry) => {
      maestro.openRepo({ directoryEntry });
    },
    [maestro],
  );

  if (isSupportedBrowser()) {
    loaders.push({
      id: "fsa",
      load: fsaCallback,
    });
  }

  loaders.push(
    {
      id: "drag-and-drop",
      load: dragAndDropCallback,
    },
    {
      id: "input-field",
      load: inputFieldCallback,
    },
    {
      id: "zip-file",
      load: zipFileCallback,
    },
  );

  return loaders;
}

export type FeaturedRepository = {
  name: string;
  url: string;
};

export function useFeaturedRepositories() {
  throw new Error("Not implemented");
}

export function useRecentRepositories() {
  throw new Error("Not implemented");
}

export function useReset(): () => void {
  throw new Error("Not implemented");
}

export function useCommits(_startDate: Date, _endDate: Date): CommitInfo[] {
  throw new Error("not implemented");
}

export type Query = {
  query: string;
  mutate: (input: string) => void;
};

export function useQuery(): Query {
  throw new Error("Not implemented");
}

export type Screen = "welcome" | "initial-load" | "main" | "error";

export type GlobalState = {
  screen: Screen;

  // TODO: to be implemented
  //indexingStep: "not-started" | "authors" | "commits" | "files" | "done";
  //numSelectedFiles: number;

  numExplorerWorkersTotal: number;
  numExplorerWorkersBusy: number;
  numExplorerJobs: number;

  numRendererWorkers: number;
  numRendererWorkersBusy: number;
  numRendererJobs: number;
};

export function useScreen(): Screen {
  const globalState = useGlobalState();

  const memoizedScreen = React.useMemo(() => {
    return globalState.screen;
  }, [globalState.screen]);

  return memoizedScreen;
}

export function useGlobalState(): GlobalState {
  const [globalState, setGlobalState] = React.useState<GlobalState>({
    screen: "welcome",
    numExplorerWorkersTotal: 0,
    numExplorerWorkersBusy: 0,
    numExplorerJobs: 0,

    numRendererWorkers: 0,
    numRendererWorkersBusy: 0,
    numRendererJobs: 0,
  });

  const trpc = useTrpc();

  trpc.globalState.useSubscription(undefined, {
    onData: (data) => {
      setGlobalState(data);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return globalState;
}

/*
useAuthorList(limit, offset)  =>  PaginatedList<Author>
useBlockHeights() => { blocks: { id: string, height: number }[] }
useSetCanvasScale() => { setScale: (scale: number) => void }
useRenderImage(id, scale) => { url: string, width: number, height: number, setViewIntersectionPercentage: (inter: number) => void }

*/

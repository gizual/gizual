import { CreateTRPCReact } from "@trpc/react-query";
import { debounce } from "lodash";
import React from "react";

import { CommitInfo, FileTreeNode } from "@giz/explorer";
import { SearchQueryType } from "@giz/query";
import type { Maestro } from "../maestro";
import type { AppRouter } from "../maestro-worker";
import { Block, Metrics, State } from "../maestro-worker-v2";

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

export function useFileContent(path: string) {
  const trpc = useTrpc();

  return trpc.fileContent.useQuery({ path });
}

export type FileLoaderDragAndDrop = {
  id: "drag-and-drop";
  name: string;
  load: (file: FileSystemDirectoryEntry) => void;
};

// Tauri only
export type FileLoaderNativeFilePicker = {
  id: "native-file-picker";
  name: string;
  openFilePicker: () => void;
};

export type FileLoaderInputField = {
  id: "input-field";
  name: string;
  load: (file: FileList) => void;
};

export type FileLoaderFSA = {
  id: "fsa";
  name: string;
  load: (handle: FileSystemDirectoryHandle) => void;
};

export type FileLoaderZipFile = {
  id: "zip-file";
  name: string;
  load: (file: File) => void;
};

export type FileLoaderUrl = {
  id: "url";
  name: string;
  load: (url: string) => void;
};

export type FileLoaderLocal =
  | FileLoaderNativeFilePicker
  | FileLoaderFSA
  | FileLoaderInputField
  | FileLoaderDragAndDrop;

export type FileLoaders = {
  local: FileLoaderLocal[];
  url: FileLoaderUrl;
  zip: FileLoaderZipFile;
};

export type FileLoader = FileLoaderLocal[] | FileLoaderUrl | FileLoaderZipFile;

export function useFileLoaders(): FileLoaders {
  const maestro = useMaestro();

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

  const localLoaders: FileLoaderLocal[] = [];

  if (isSupportedBrowser()) {
    localLoaders.push({ id: "fsa", load: fsaCallback, name: "File System Access" });
  }

  localLoaders.push(
    { id: "drag-and-drop", load: dragAndDropCallback, name: "Drag and drop" },
    { id: "input-field", load: inputFieldCallback, name: "HTML Input" },
  );

  const loaders: FileLoaders = {
    local: localLoaders,
    url: {
      id: "url",
      name: "From URL",
      load: (url: string) => console.warn("Not implemented. Called with URL:", url),
    },
    zip: { id: "zip-file", name: ".zip file", load: zipFileCallback },
  };

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

export type UseQueryResult = {
  query: SearchQueryType;
  updateQuery: (input: Partial<SearchQueryType>) => void;
  setQuery: (input: SearchQueryType) => void;
};

export function useQuery(): UseQueryResult {
  const trpc = useTrpc();

  const [query, setQueryCache] = React.useState<SearchQueryType>({} as any);

  trpc.query.useSubscription(undefined, {
    onData: (data) => {
      setQueryCache(data);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const setMutation = trpc.setQuery.useMutation();
  const updateMutation = trpc.updateQuery.useMutation();

  const updateQuery = React.useCallback(
    (input: Partial<SearchQueryType>) => {
      updateMutation.mutate({ input });
    },
    [updateMutation.mutate],
  );

  const setQuery = React.useCallback(
    (input: SearchQueryType) => {
      setMutation.mutate({ input });
    },
    [setMutation.mutate],
  );

  return { query, updateQuery, setQuery };
}

export function useSetScale(): (scale: number) => void {
  const trpc = useTrpc();

  const setScaleMutation = trpc.setScale.useMutation();

  const setScale = React.useCallback(
    (scale: number) => {
      setScaleMutation.mutate({ scale });
    },
    [setScaleMutation.mutate],
  );

  return setScale;
}

export function useQueryIsValid(): boolean {
  return useGlobalState().queryValid;
}

export type Screen = "welcome" | "initial-load" | "main" | "error";

export type GlobalState = State;

export function useScreen(): Screen {
  const globalState = useGlobalState();

  const memoizedScreen = React.useMemo(() => {
    return globalState.screen;
  }, [globalState.screen]);

  return memoizedScreen;
}

export function useGlobalState(): GlobalState {
  const [globalState, setGlobalState] = React.useState<GlobalState>({
    queryValid: true,
    screen: "welcome",
    repoLoaded: false,
    authorsLoaded: false,
    commitsIndexed: false,
    filesIndexed: false,
    error: undefined,
    branches: [],
    remotes: [],
    tags: [],
  });

  const trpc = useTrpc();

  trpc.globalState.useSubscription(undefined, {
    onData: (data) => {
      setGlobalState(data as any);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return globalState;
}

export function useMetrics(): Metrics {
  const [metrics, setMetrics] = React.useState<Metrics>({
    numSelectedFiles: 0,
    numExplorerWorkersTotal: 0,
    numExplorerWorkersBusy: 0,
    numExplorerJobs: 0,

    numRendererWorkers: 0,
    numRendererWorkersBusy: 0,
    numRendererJobs: 0,
  });

  const trpc = useTrpc();

  trpc.metrics.useSubscription(undefined, {
    onData: (data) => {
      setMetrics(data);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return metrics;
}

/*
useSetCanvasScale() => { setScale: (scale: number) => void }
useRenderImage(id, scale) => { url: string, width: number, height: number, setViewIntersectionPercentage: (inter: number) => void }
*/

export function useAvailableFiles(): FileTreeNode[] {
  const trpc = useTrpc();

  const [availableFiles, setAvailableFiles] = React.useState<FileTreeNode[]>([]);

  trpc.availableFiles.useSubscription(undefined, {
    onData: (data) => {
      setAvailableFiles(data);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return availableFiles;
}

export function useSelectedFiles(): FileTreeNode[] {
  const trpc = useTrpc();

  const [selectedFiles, setSelectedFiles] = React.useState<FileTreeNode[]>([]);

  trpc.selectedFiles.useSubscription(undefined, {
    onData: (data) => {
      setSelectedFiles(data);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return selectedFiles;
}

export function useBlocks(): Block[] {
  const trpc = useTrpc();

  const [blocks, setBlocks] = React.useState<Block[]>([]);

  trpc.blocks.useSubscription(undefined, {
    onData: (data) => {
      setBlocks(data);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  return blocks;
}

export type UseBlockImageResult = {
  url: string;
  isPreview: boolean;
  setPriority: (inter: number) => void;
};

export function useBlockImage(id: string) {
  const trpc = useTrpc();

  const setPriorityMutation = trpc.setPriority.useMutation();

  const setPriority = React.useCallback(
    debounce(
      (priority: number) => {
        setPriorityMutation.mutate({ id, priority });
      },
      200,
      { leading: false, trailing: true },
    ),
    [setPriorityMutation.mutate],
  );

  const [blockImage, setBlockImage] = React.useState({
    url: "",
    isPreview: false,
  });

  trpc.blockImages.useSubscription(
    { id },
    {
      onData: (data) => {
        setBlockImage(data);
      },

      onError: (err) => {
        console.error(err);
      },
    },
  );

  return {
    url: blockImage.url,
    isPreview: blockImage.isPreview,
    setPriority,
  };
}

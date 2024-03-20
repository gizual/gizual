import { CreateTRPCReact } from "@trpc/react-query";
import { debounce } from "lodash";
import React from "react";

import { CommitInfo, FileTreeNode } from "@giz/explorer";
import { SearchQueryType } from "@giz/query";
import type { Maestro } from "../maestro";
import type { AppRouter } from "../maestro-worker";
import type { Block, Metrics, State, TimeMode } from "../maestro-worker-v2";
import type { QueryError } from "../query-utils";

import { MaestroContext, TrpcContext } from "./providers";

function hasFileSystemAccessAPI() {
  return "showDirectoryPicker" in window;
}

function canWriteOpfsMainThread() {
  return (
    typeof FileSystemFileHandle !== "undefined" && !!FileSystemFileHandle.prototype.createWritable
  );
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

  const urlCallback = React.useCallback(
    (url: string) => {
      maestro.openRepoFromURL(url);
    },
    [maestro],
  );

  const localLoaders: FileLoaderLocal[] = [];

  if (hasFileSystemAccessAPI()) {
    localLoaders.push({ id: "fsa", load: fsaCallback, name: "File System Access" });
  }

  if (canWriteOpfsMainThread()) {
    localLoaders.push(
      { id: "drag-and-drop", load: dragAndDropCallback, name: "Drag and drop" },
      { id: "input-field", load: inputFieldCallback, name: "HTML Input" },
    );
  }

  const loaders: FileLoaders = {
    local: localLoaders,
    url: {
      id: "url",
      name: "From URL",
      load: urlCallback,
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
  errors?: QueryError[];
  updateQuery: (input: Partial<SearchQueryType>) => void;
  setQuery: (input: SearchQueryType) => void;
  setTimeMode: (mode: TimeMode) => void;
};

export function useQuery(): UseQueryResult {
  const maestro = useMaestro();
  const query = maestro.query.get();
  const errors = maestro.queryErrors.get();

  const setQuery = maestro.setQuery;
  const updateQuery = maestro.updateQuery;
  const setTimeMode = maestro.setTimeMode;

  return { query, errors, updateQuery, setQuery, setTimeMode };
}

export function useSetScale(): (scale: number) => void {
  const trpc = useTrpc();

  const setScaleMutation = trpc.setScale.useMutation();

  const setScale = React.useCallback(
    debounce(
      (scale: number) => {
        setScaleMutation.mutate({ scale });
      },
      400,
      {
        leading: false,
        trailing: true,
      },
    ),
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

  return globalState.screen;
}

export function useGlobalState(): GlobalState {
  return useMaestro().globalState.get();
}

export function useMetrics(): Metrics {
  return useMaestro().metrics.get();
}

export function useAvailableFiles(): FileTreeNode[] {
  return useMaestro().availableFiles.get();
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

  const setBlockInViewMutation = trpc.setBlockInViewMutation.useMutation();
  const ref = React.useRef<boolean>(false);

  const setPriority = React.useCallback(
    (priority: number) => {
      const inView = priority > 0;
      const changed = ref.current !== inView;
      if (!changed) return;
      ref.current = inView;
      setBlockInViewMutation.mutate({ id, inView });
    },
    [setBlockInViewMutation.mutate],
  );

  const [blockImage, setBlockImage] = React.useState({
    url: "",
    isPreview: false,
    isTruncated: false,
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
    isTruncated: blockImage.isTruncated,
    setPriority,
  };
}

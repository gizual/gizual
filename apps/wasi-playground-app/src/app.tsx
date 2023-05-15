import React from "react";

import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";

import { WasiRuntime } from "@giz/wasi-runtime";

const wasmFilePath = "/wasi-playground-module.wasm";

async function runWasiCommand(args: string[]): Promise<string> {
  const handle = await window.showDirectoryPicker();

  const runtime = await WasiRuntime.create({
    moduleUrl: wasmFileUrl,
    moduleName: wasmFilePath,
    folderMappings: {
      "/repo": handle,
    },
  });

  const output = await runtime.run({
    args,
    env: {},
  });

  return output;
}

const AnimatedLoadingIndicator = () => {
  const [dots, setDots] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => (dots + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{Array.from({ length: dots + 1 }).map(() => ".")} </span>;
};

const App = () => {
  const [output, setOutput] = React.useState("");

  const [loading, setLoading] = React.useState(false);

  const runCommand = React.useCallback(async () => {
    setLoading(true);
    try {
      const stdout = await runWasiCommand(["package.json"]);
      setOutput(stdout);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }, []);

  return (
    <div>
      <button onClick={runCommand}>Run command</button>

      <code>
        <pre>{output}</pre>
      </code>

      {loading && <AnimatedLoadingIndicator />}
    </div>
  );
};

export default App;

/*

const loadRepo = async () => {
  try {
    wasmFS.removeDir("/repo");
  } catch (error) {
    console.log("error removing dir", error);
  }
  const dirHandle = await window.showDirectoryPicker();

  const refs = await getFileRefs(dirHandle, {
    match: (path) => path.startsWith(".git"),
    modifyWebkitRelativePath: (path) => {
      if (path.startsWith(".git/")) {
        return path;
      }
      return path.slice(Math.max(0, path.indexOf("/") + 1));
    },
  });

  const hasGitFolder = refs.some(
    (ref) => ref.fullPath.startsWith(".git/objects") || ref.fullPath.startsWith(".git/index")
  );

  if (!hasGitFolder) {
    throw new Error("opened directory does not seem like a valid git repository");
  }

  console.time("wasmfs#open");
  await copyFileRefsToWasmFS(refs, wasmFS, "/repo");
  console.timeEnd("wasmfs#open");
  console.log("finished loading repo");
};

 */

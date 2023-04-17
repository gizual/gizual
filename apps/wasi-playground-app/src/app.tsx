import { init, MemFS, WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import * as Asyncify from "asyncify-wasm";
import React from "react";

import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";

import { copyFileRefsToWasmFS, getFileRefs } from "./file-io";

const wasmFilePath = "/explorer-backend-libgit2.wasm";

await init();
const wasmFS = new MemFS();

wasmFS.createDir("/repo/");

async function runWasiCommand(args: string[]): Promise<string> {
  const start = performance.now();

  const wasi = new WASI({
    args: [wasmFilePath, ...args],
    fs: wasmFS,
    env: {},
    preopens: {
      "/repo": "/repo",
    },
  });

  const wasmBytes = await fetch(wasmFileUrl).then((res) => res.arrayBuffer());
  const loweredWasmBytes = await lowerI64Imports(new Uint8Array(wasmBytes));

  const wasmModule = await WebAssembly.compile(loweredWasmBytes);
  const imports = wasi.getImports(wasmModule);

  const runCommandPromise = new Promise<void>(async (resolve, reject) => {
    const instance = await Asyncify.instantiate(wasmModule, {
      ...imports,
      wasi_snapshot_preview1: {
        ...imports.wasi_snapshot_preview1,
        fd_advise: async (fd, offset, len, advice) => {
            console.log("fd_advise", fd, offset, len, advice);
            return imports.wasi_snapshot_preview1.fd_advise(fd, offset, len, advice);
        },
        path_open: async (
          dirfd,
          dirflags,
          pathPtr,
          pathLen,
          oflags,
          fsRightsBase,
          fsRightsInheriting,
          fdflags,
          fdPtr
        ) => {
          const p = window.Buffer.from(instance.exports.memory.buffer, pathPtr, pathLen).toString();

          return new Promise((resolve, reject) => {
            console.log("path_open", p);
            const delay = Math.random() * 1000;
            console.log("add random async delay of", delay, "ms");
            setTimeout(() => {
              const res = imports.wasi_snapshot_preview1.path_open(
                dirfd,
                dirflags,
                pathPtr,
                pathLen,
                oflags,
                fsRightsBase,
                fsRightsInheriting,
                fdflags,
                fdPtr
              );
              resolve(res);
            }, delay);
          });
        },
      },
      feedback: {
        finished: () => {
          console.log("finished");
          resolve();
        },
      },
    });

    try {
      console.log("starting WASI...", wasmFileUrl);
      wasi.start(instance);
    } catch (error) {
      reject(error);
      /*
console.log("failed to run WASI command", error);
      output += `\n# Error: ${error}`;
 */
    }
  });
  let output = "";

  await runCommandPromise;

  const end = performance.now();
  const durationSeconds = (end - start) / 1000;
  output += `\n# Ran command in ${Math.round(durationSeconds * 1000) / 1000} seconds`;

  const stdout = wasi.getStdoutString();
  console.log("finally", stdout);

  // wasmFS.fs.writeFileSync("/dev/stdout", "");
  // wasmFS.volume.fds[1].position = 0; // reset stdout position
  output += `\n` + stdout;

  return output;
}

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

const App = () => {
  const [output, setOutput] = React.useState("");

  const runCommand = React.useCallback(async () => {
    const stdout = await runWasiCommand(["package.json"]);
    setOutput(stdout);
  }, []);

  return (
    <div>
      <button onClick={runCommand}>Run command</button>
      <button onClick={loadRepo}>Load Repo</button>
      <code>
        <pre>{output}</pre>
      </code>
    </div>
  );
};

export default App;

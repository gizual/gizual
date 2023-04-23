import { init, MemFS, WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import * as Asyncify from "asyncify-wasm";
import React from "react";

import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";

import { copyFileRefsToWasmFS, getFileRefs } from "./file-io";
import { AsyncFS } from "./fs-access-api";

const wasmFilePath = "/explorer-backend-libgit2.wasm";

await init();
const wasmFS = new MemFS();

wasmFS.createDir("/repo/");

const USE_CUSTOM_FS = true;

async function runWasiCommand(args: string[]): Promise<string> {
  const handle = await window.showDirectoryPicker();

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

  const wasiImports = wasi.getImports(wasmModule);

  const customFS = new AsyncFS({
    "/repo": handle,
  });

  customFS.setOriginalImports(wasiImports as any);

  const debugWrap = (imports: Record<string, any>) => {
    const debugImports: Record<string, Record<string, unknown>> = {};
    for (const moduleName of Object.keys(imports)) {
      debugImports[moduleName] = {};
      for (const functionName of Object.keys(imports[moduleName])) {
        debugImports[moduleName][functionName] = (...args: any[]) => {
          console.log("call", moduleName, functionName, args);

          const result = (imports[moduleName][functionName] as any)(...args);
          if (result && result.then) {
            return result.then((res: any) => {
              console.log("->", res);
              return res;
            });
          } else {
            console.log("->", result);
            return result;
          }
        };
      }
    }
    return debugImports;
  };

  // eslint-disable-next-line no-async-promise-executor
  const runCommandPromise = new Promise<void>(async (resolve, reject) => {
    const importsToInject = USE_CUSTOM_FS ? customFS.getImports() : wasiImports;

    const imports = {
      ...importsToInject,
      feedback: {
        finished: () => {
          console.log("finished");
          resolve();
        },
      },
    };

    const instance = await Asyncify.instantiate(wasmModule, debugWrap(imports) as any);

    customFS.setMemory(instance.exports.memory as any);
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

  const stdout = USE_CUSTOM_FS ? customFS.getStdout() : wasi.getStdoutString();
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
      <button disabled={USE_CUSTOM_FS} onClick={loadRepo}>Load Repo</button>
      <code>
        <pre>{output}</pre>
      </code>
    </div>
  );
};

export default App;

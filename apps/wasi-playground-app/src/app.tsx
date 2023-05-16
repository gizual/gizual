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

  const [command, setCommand] = React.useState("blame");
  const [branch, setBranch] = React.useState("main");
  const [file, setFile] = React.useState("package.json");

  const runCommand = React.useCallback(async () => {
    setLoading(true);
    try {
      const stdout = await runWasiCommand([command, branch, file]);
      setOutput(stdout);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }, [command, branch, file]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCommand(event.target.value);
  };

  return (
    <div>
      <button onClick={runCommand}>Run command</button>

      <select value={command} onChange={handleChange}>
        <option value="blame">blame</option>
        <option value="filetree">filetree</option>
        <option value="file_content">file_content</option>
        <option value="list_branches">list_branches</option>
      </select>

      <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} />
      <input type="text" value={file} onChange={(e) => setFile(e.target.value)} />
      <code>
        <pre>{output}</pre>
      </code>

      {loading && <AnimatedLoadingIndicator />}
    </div>
  );
};

export default App;



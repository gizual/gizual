import React from "react";

import { ExplorerPool } from "@giz/explorer";

async function prepareRuntime(): Promise<ExplorerPool> {
  const handle = await window.showDirectoryPicker();

  return await ExplorerPool.create(handle);
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
  React.useEffect(() => {});

  const [runtime, setRuntime] = React.useState<ExplorerPool | undefined>();

  const setupRuntime = React.useCallback(() => {
    prepareRuntime().then((runtime) => {
      setRuntime(runtime);
    });
  }, []);

  const [output, setOutput] = React.useState("");

  const [loading, setLoading] = React.useState(false);

  const [command, setCommand] = React.useState("blame");
  const [branch, setBranch] = React.useState("main");
  const [file, setFile] = React.useState("package.json");

  const runCommand = React.useCallback(async () => {
    if (!runtime) {
      console.error("No runtime");
      return;
    }
    setOutput("");
    setLoading(true);
    try {
      const stdout = await (() => {
        switch (command) {
          case "blame": {
            return runtime.getBlame(branch, file);
          }
          case "file_tree": {
            return runtime.getFileTree(branch);
          }
          case "file_content": {
            return runtime.getFileContent(branch, file);
          }
          case "list_branches": {
            return runtime.getBranches();
          }
          case "git_graph": {
            return runtime.getGitGraph();
          }

          case "get_commits_for_branch": {
            return runtime.execute("get_commits_for_branch", [branch]);
          }
        }

        return Promise.resolve("Unknown command");
      })();

      if (typeof stdout === "string") {
        setOutput(stdout);
      } else {
        setOutput(JSON.stringify(stdout, undefined, 2));
      }
    } catch (error) {
      console.error(error);
      if (typeof error === "string") setOutput(error);
      if (typeof error === "object") setOutput(JSON.stringify(error, undefined, 2));
      if (error instanceof Error) setOutput(error.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }, [command, branch, file, runtime]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCommand(event.target.value);
  };

  return (
    <div>
      {!runtime && <button onClick={setupRuntime}>Setup runtime</button>}
      {runtime && (
        <>
          <button onClick={runCommand}>Run command</button>

          <select value={command} onChange={handleChange}>
            <option value="blame">blame</option>
            <option value="file_tree">file_tree</option>
            <option value="file_content">file_content</option>
            <option value="list_branches">list_branches</option>
            <option value="git_graph">git_graph</option>
            <option value="get_commits_for_branch">get_commits_for_branch</option>
          </select>

          <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} />
          <input type="text" value={file} onChange={(e) => setFile(e.target.value)} />
        </>
      )}
      <code>
        <pre>{output}</pre>
      </code>

      {loading && <AnimatedLoadingIndicator />}
    </div>
  );
};

export default App;

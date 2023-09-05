import React from "react";

import dbModule from "@giz/db/db.wasm?url";
import { ExplorerPool } from "@giz/explorer";
import { WasiRuntime } from "@giz/wasi-runtime";

async function prepareRuntime(): Promise<[ExplorerPool | undefined, WasiRuntime]> {
  const handle = await window.showDirectoryPicker();

  //const runtime = await ExplorerPool.create(handle);

  const db = await WasiRuntime.create({
    folderMappings: {
      "/repo": handle,
    },
    moduleName: "db",
    moduleUrl: dbModule,

  });

  db.run({
    env: {},
    args: [],
  })

  const stdout = await db.readStdout();
  console.log(stdout);

  return [undefined, db];
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
  const [db, setDb] = React.useState<WasiRuntime | undefined>();
  const [sql, setSql] = React.useState<string>("SELECT * FROM commits");

  const setupRuntime = React.useCallback(() => {
    setLoading(true);
    prepareRuntime().then(([runtime_, db_]) => {
      setRuntime(runtime_);
      setDb(db_);
      setLoading(false);
    });
  }, []);

  const runSql = async () => {
    console.log("Running SQL");
    if (!db) {
      console.error("No db");
      return;
    }
    const payload = {
      jsonrpc: "2.0",
      method: "run_sqlite",
      params: [sql.trim()],
      id: 1,
    };

    await db.writeStdin(JSON.stringify(payload) + "\n");
    let stdout = "";
    while (true) {
      console.log("awaiting stdout");

      stdout = await db.readStdout();
      if (!stdout) {
        console.log("No stdout");
        continue;
      }
      break;
    }

    console.log(stdout);

    const data = JSON.parse(stdout || "{}");

    setOutput(data.result)
  };

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
      {!runtime && !db && <button onClick={setupRuntime}>Setup runtime</button>}
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

      {db && (
        <>
          <br />

         

          <div style={{ display: "flex"}}>
          <textarea rows={3} cols={75} value={sql} onChange={(e) => setSql(e.target.value)} />
          <button onClick={runSql}>Run SQL</button>
          </div>
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

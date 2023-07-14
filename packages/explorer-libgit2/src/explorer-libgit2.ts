import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";
import { WasiRuntime } from "@giz/wasi-runtime";

import { Blame, FileContent, FileTree, isBlame, isFileContent, isFileTree } from "./types";
const wasmFilePath = "/wasi-playground-module.wasm";

const SKIP_VALIDATION = false;
export class ExplorerLibgit2 {
  private constructor(private handle: FileSystemDirectoryHandle, private runtime: WasiRuntime) {}

  static async create(handle: FileSystemDirectoryHandle) {
    const runtime = await WasiRuntime.create({
      moduleUrl: wasmFileUrl,
      moduleName: wasmFilePath,
      folderMappings: {
        "/repo": handle,
      },
    });

    runtime.run({
      env: {},
      args: [],
    });
    const stdout = await runtime.readStdout();
    const data = JSON.parse(stdout);
    if (!data?.ready) {
      throw new Error(data.error);
    }

    console.log("backend booted");

    return new ExplorerLibgit2(handle, runtime);
  }

  async runRpcCommand(method: string, params?: any[]): Promise<any> {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    };

    const payloadString = JSON.stringify(payload) + "\n";
    console.log("payload", payloadString);
    this.runtime.writeStdin(payloadString);

    const stdout = await this.runtime.readStdout();
    console.log("stdout", stdout);
    const data = JSON.parse(stdout);
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result;
  }

  async getBranches(): Promise<string[]> {
    const output = await this.runRpcCommand("list_branches");

    if (
      SKIP_VALIDATION ||
      (Array.isArray(output) && output.every((branch) => typeof branch === "string"))
    ) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getBlame(branch: string, path: string): Promise<Blame> {
    const output = await this.runRpcCommand("blame", [{ branch, path }]);

    if (SKIP_VALIDATION || isBlame(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getFileContent(branch: string, path: string): Promise<string> {
    const output = await this.runRpcCommand("file_content", [{ branch, path }]);

    return output;
  }

  async getFileTree(branch: string): Promise<FileTree> {
    const output = await this.runRpcCommand("file_tree", [{ branch }]);

    if (SKIP_VALIDATION || isFileTree(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getCommitTree() {
    const output = await this.runRpcCommand("commit_tree", []);
    return output;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import wasmFileUrl from "@giz/explorer-backend-libgit2/dist/explorer-backend-libgit2.wasm?url";
import { WasiRuntime } from "@giz/wasi-runtime";

import {Blame, FileContent, FileTree, isBlame, isFileContent, isFileTree} from "./types";
const wasmFilePath = "/wasi-playground-module.wasm";

const SKIP_VALIDATION = true;
export class ExplorerLibgit2 {
  private constructor(private handle: FileSystemDirectoryHandle) {}

  static async create(handle: FileSystemDirectoryHandle) {
    return new ExplorerLibgit2(handle);
  }

  private async run(command: string, arg1 = " ", arg2 = " ") {
    const runtime = await WasiRuntime.create({
      moduleUrl: wasmFileUrl,
      moduleName: wasmFilePath,
      folderMappings: {
        "/repo": this.handle,
      },
    });

    const result = await runtime.run({
      args: [command, arg1, arg2],
      env: {},
    });
    try {
      return JSON.parse(result.trim());
    }
    catch (error: any) {
      console.error(result);
      throw error;
    }
  }

  async getBranches(): Promise<string[]> {
    const output = await this.run("list_branches");

    if (
      SKIP_VALIDATION ||
      (Array.isArray(output) && output.every((branch) => typeof branch === "string"))
    ) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getBlame(branch: string, path: string): Promise<Blame> {
    const output = await this.run("blame", branch, path);

    if (SKIP_VALIDATION || isBlame(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getFileContent(branch: string, path: string): Promise<FileContent> {
    const output = await this.run("file_content", branch, path);

    if (SKIP_VALIDATION || isFileContent(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }

  async getFileTree(branch: string): Promise<FileTree> {
    const output = await this.run("filetree", branch);

    if (SKIP_VALIDATION || isFileTree(output)) {
      return output;
    }
    throw new TypeError("Unexpected output");
  }
}

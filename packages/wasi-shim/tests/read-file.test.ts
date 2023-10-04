import { describe, expect, test } from "bun:test";

import { Fd, FsaFS, MemoryFS, WASI } from "../src";

import { prepareWasm } from "./_helper";
import { createFSAMock, FSLayout, toMemoryFS } from "./_mocks";

const fsLayout: FSLayout = {
  "hello.txt": "Hello World!",
};

describe("read-file", async () => {
  test("fsa-fs", async () => {
    const fs = await FsaFS.fromDirectoryHandle("/", createFSAMock("/", fsLayout));

    await runReadFileTestcase(fs);
  });

  test("memory-fs", async () => {
    const fs = new MemoryFS("/", toMemoryFS(fsLayout));
    await runReadFileTestcase(fs);
  });
});

async function runReadFileTestcase(fs: Fd) {
  const moduleUrl = await prepareWasm("read-file-01.c");

  const wasi = await WASI.create(moduleUrl, {
    args: ["/hello.txt"],
    env: [],
    fs,
  });

  const exitCode = await wasi.run();

  expect(exitCode).toBe(0);

  const stdout = wasi.readAllStdout();

  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  expect(lines).toEqual([`file_content = "Hello World!"`]);

  expect(exitCode).toBe(0);
}

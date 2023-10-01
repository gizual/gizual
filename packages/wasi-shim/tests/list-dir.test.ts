import { describe,expect, test } from "bun:test";

import { Fd, MemoryFS, WASI } from "../src";
import { FsaFS } from "../src/fsa-fs";

import { prepareWasm } from "./_helper";
import { createFSAMock, FSLayout, toMemoryFS } from "./_mocks";

const FSLayout: FSLayout = {
  "hello.txt": "",
  "world.txt": "",
  subdir: {
    subsubdir: {
      "abc.c": "",
    },
  },
  "abc.c": "",
};

describe("list-dir", async () => {
  test("fsa-fs", async () => {
    const fs = await FsaFS.fromDirectoryHandle("/", createFSAMock("/", FSLayout));

    await runListDirTestcase(fs);
  });

  test("memory-fs", async () => {
    const fs = new MemoryFS("/", toMemoryFS(FSLayout));

    await runListDirTestcase(fs);
  });
});

async function runListDirTestcase(fs: Fd) {
  const moduleUrl = await prepareWasm("list-dir-01.c");

  let wasi = await WASI.create(moduleUrl, {
    args: ["/"],
    fs,
  });

  expect(wasi).toBeDefined();

  let exitCode = await wasi.run();

  let stdout = wasi.readAllStdout();

  let lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  expect(lines).toEqual([
    `entry->d_name = "subdir", entry->d_type = 3`,
    `entry->d_name = "hello.txt", entry->d_type = 4`,
    `entry->d_name = "world.txt", entry->d_type = 4`,
    `entry->d_name = "abc.c", entry->d_type = 4`, // 4 = Normal file
  ]);

  expect(exitCode).toBe(0);

  wasi = await WASI.create(moduleUrl, {
    args: ["/subdir/subsubdir"],
    fs,
  });

  expect(wasi).toBeDefined();

  exitCode = await wasi.run();

  stdout = wasi.readAllStdout();

  lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  expect(lines).toEqual([`entry->d_name = "abc.c", entry->d_type = 4`]);
}

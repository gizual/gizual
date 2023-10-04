import { expect, test } from "bun:test";

import { WASI } from "../src";

import { prepareWasm } from "./_helper";

const moduleUrl1 = await prepareWasm("stdout-01.c");

test("fd_write to stdout", async () => {
  const wasi = await WASI.create(moduleUrl1, {
    args: [],
  });

  expect(wasi).toBeDefined();

  const exitCode = await wasi.run();

  const stdout = await wasi.readStdoutLine();

  expect(stdout).toBe("Hello, world!");

  expect(exitCode).toBe(0);
});

const moduleUrl2 = await prepareWasm("stdout-02.c");

test("printf to stdout (fd_write & fd_seek)", async () => {
  const wasi = await WASI.create(moduleUrl2, {
    args: [],
  });

  expect(wasi).toBeDefined();

  const exitCode = await wasi.run();

  const stdout1 = await wasi.readStdoutLine();
  const stdout2 = await wasi.readStdoutLine();

  expect(stdout1).toBe("Hello");
  expect(stdout2).toBe("deadbeef!");

  expect(exitCode).toBe(0);
});

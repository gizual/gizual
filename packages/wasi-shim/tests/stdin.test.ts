import { expect, test } from "bun:test";

import { WASI } from "../src";

import { prepareWasm } from "./_helper";

const moduleUrl1 = await prepareWasm("stdin-01.c");

test("fd_read from stdin (sync,simple)", async () => {
  const wasi = await WASI.create(moduleUrl1, {
    args: [],
  });

  wasi.writeStdin("Hello, world!\n");

  expect(wasi).toBeDefined();

  const exitCode = await wasi.run();

  expect(exitCode).toBe(0);
});

test("fd_read from stdin (async)", async () => {
  const wasi = await WASI.create(moduleUrl1, {
    args: [],
  });

  expect(wasi).toBeDefined();

  const exitPromise = wasi.run();

  await new Promise((resolve) => setTimeout(resolve, 10));

  wasi.writeStdin("Hello, world!\n");

  const exitCode = await exitPromise;

  expect(exitCode).toBe(0);
});

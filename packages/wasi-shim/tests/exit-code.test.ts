import { expect, test } from "bun:test";

import { WASI } from "../src";

import { prepareWasm } from "./_helper";

const moduleUrl1 = await prepareWasm("exit-code-01.c");
test("proc_exit(42)", async () => {
  const wasi = await WASI.create(moduleUrl1, {
    args: [],
  });

  expect(wasi).toBeDefined();

  const exitCode = await wasi.run();

  expect(exitCode).toBe(42);
});

const moduleUrl2 = await prepareWasm("exit-code-02.c");

test("proc_exit(0)", async () => {
  const wasi = await WASI.create(moduleUrl2, {
    args: [],
  });

  expect(wasi).toBeDefined();

  const exitCode = await wasi.run();

  expect(exitCode).toBe(0);
});

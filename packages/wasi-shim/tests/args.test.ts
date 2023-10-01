import { expect, test } from "bun:test";

import { WASI } from "../src";

import { prepareWasm } from "./_helper";

test("args", async () => {
  const moduleUrl = await prepareWasm("args-01.c");

  const wasi = await WASI.create(moduleUrl, {
    args: ["hello", "world!", "foo"],
  });

  expect(wasi).toBeDefined();

  const exitCode = await wasi.run();

  const stdout = wasi.readAllStdout();

  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  expect(lines).toEqual([
    "argc = 4",
    'argv[0] = ""',
    'argv[1] = "hello"',
    'argv[2] = "world!"',
    'argv[3] = "foo"',
  ]);

  expect(exitCode).toBe(0);
});

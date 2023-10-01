import { expect, test } from "bun:test";

import { ZipFS } from ".";
test("memory-fs", async () => {
  const fs = await ZipFS.fromURL("/demo", new URL("demo.zip", import.meta.url));

  const encoder = new TextEncoder();

  expect(fs.toJSON()).toEqual({
    "/demo": {
      "asdf.txt": {
        data: encoder.encode("Hey asdf\n"),
        readonly: true,
      },
      "hello-world.txt": {
        data: encoder.encode("Hey there\n"),
        readonly: true,
      },
      subdir: {
        "abc.txt": {
          data: encoder.encode("Hey abc\n"),
          readonly: true,
        },
        "efg.txt": {
          data: encoder.encode("Hey efg\n"),
          readonly: true,
        },
        subsubdir: {
          "123.txt": {
            data: encoder.encode("Hey 123\n"),
            readonly: true,
          },
          "456.txt": {
            data: encoder.encode("Hey 456\n"),
            readonly: true,
          },
        },
      },
    },
  });
});

import { MemoryDirectory, MemoryFile } from "../../src";

import { FSLayout } from "./fsa-mock";

export * from "./fsa-mock";

export function toMemoryFS(layout: FSLayout) {
  return Object.fromEntries(
    Object.entries(layout).map(([name, entry]) => {
      if (typeof entry === "string") {
        return [name, new MemoryFile(entry)];
      }

      if (entry instanceof Uint8Array) {
        return [name, new MemoryFile(entry)];
      }

      if (typeof entry === "object") {
        return [name, new MemoryDirectory(toMemoryFS(entry))];
      }

      throw new Error(`Unexpected entry type: ${typeof entry}`);
    }),
  );
}

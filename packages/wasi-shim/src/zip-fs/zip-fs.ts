import { UnzipFileInfo, unzipSync } from "fflate";

import { MemoryDirectory, MemoryFile, MemoryFS } from "../memory-fs";

export class ZipFS extends MemoryFS {
  static async fromURL(name: string, url: URL): Promise<ZipFS> {
    const buffer = await fetch(url)
      .then((res) => res.arrayBuffer())
      .then((res) => new Uint8Array(res));

    return new ZipFS(name, buffer);
  }

  constructor(name: string, data: Uint8Array) {
    const rootDir = new MemoryDirectory({});

    const unzipped = unzipSync(data, {
      filter: (info: UnzipFileInfo) => !info.name.startsWith("__MACOSX"),
    });

    for (const [filePath, content] of Object.entries(unzipped)) {
      const pathComponents = filePath.split("/");
      const fileName = pathComponents.pop()!;
      const dirPath = pathComponents.join("/");

      let dir = rootDir;
      for (const component of pathComponents) {
        if (dir.contents[component] == undefined) {
          const newDir = new MemoryDirectory({});
          dir.contents[component] = newDir;
          dir = newDir;
        } else if (dir.contents[component] instanceof MemoryDirectory) {
          dir = dir.contents[component] as MemoryDirectory;
        } else {
          throw new TypeError("Expected directory but found file when expanding zip");
        }
      }

      if (fileName === "") {
        continue;
      }

      dir.contents[fileName] = new MemoryFile(content, { readonly: true });
    }

    super(name, rootDir);
  }
}

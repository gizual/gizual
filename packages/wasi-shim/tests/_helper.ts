import path from "node:path";

import { buildC, configure } from "@giz/wasi-tools";
configure(false);

export async function prepareWasm(name: string): Promise<string> {
  const srcFilePath = path.join(__dirname, name);
  const srcFile = Bun.file(srcFilePath);

  const nameWithoutSuffix = name.slice(0, name.lastIndexOf("."));
  const outFilePath = path.join(__dirname, `build/${nameWithoutSuffix}.wasm`);
  const outFile = Bun.file(outFilePath);

  if (!(await srcFile.exists)) {
    throw new Error(`File not found: ${srcFilePath}`);
  }

  const srcModified = srcFile.lastModified;
  const dstModified = (await outFile.exists) ? outFile.lastModified : 0;

  if (srcModified <= dstModified) {
    return outFilePath;
  }
  return await buildC({
    cwd: __dirname,
    input: srcFilePath,
    output: outFilePath,
  });
}

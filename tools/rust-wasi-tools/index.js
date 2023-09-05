import "zx/globals";

import { mkdirp } from "mkdirp";
import { $, path } from "zx";
import { getWasiSdkPath } from "./wasi-sdk.js";
import { prepareBinaryen } from "./binaryen.js";

const PATH_SEPARATOR = process.platform === "win32" ? ";" : ":";

export async function prepareRustOnPlatform() {
  if (process.platform === "win32") {
    // Ensure we have the windows gnu toolchain installed so we are able to build without msvc.
    // This toolchain is used for the "host" target, which then builds the wasm32-wasi target.
    await $`rustup toolchain install stable-x86_64-pc-windows-gnu --force-non-host`;
    await $`rustup override set stable-x86_64-pc-windows-gnu`;
    await $`rustup target add x86_64-pc-windows-gnu`;
  }

  await $`rustup target add wasm32-wasi`;
}

/**
 * @typedef {Object} BuildRustOptions
 * @property {string  | undefined} [cwd] - The directory to run the rust build command in. Defaults to the current directory.
 * @property {string | undefined} [name] - The name of the rust project. Defaults to the name of the current directory.
 * @property {string | undefined} [outDir] - The directory to output the wasm file to. Defaults to dist.
 * @property {boolean | undefined} [release] - Whether to build in release mode. Defaults to true.
 * @property {boolean | undefined} [prepare] - Whether to prepare the rust toolchain for the wasm32-wasi target. Defaults to true.
 * @property {boolean | undefined} [asyncify] - Whether to run wasm-opt with the --asyncify flag. Defaults to true.
 * @property {boolean | undefined} [debuginfo] - Whether to run wasm-opt with the --debuginfo flag. Defaults to true.
 */

/**
 * Build the rust project of the current directory for the wasm32-wasi target.
 * @param {BuildRustOptions} opts
 */
export async function buildRust(opts) {
  const {
    cwd = process.cwd(),
    name = path.basename(cwd),
    prepare = true,
    asyncify = true,
    debuginfo = true,
    release = true,
    outDir = path.join(cwd, "dist"),
  } = opts;

  $.cwd = cwd;

  const rootPath = (await $`git rev-parse --show-toplevel`).stdout.trim();

  const env = await getEnv(rootPath);

  if (prepare) {
    await prepareRustOnPlatform();
  }

  const TARGET = env.TARGET;

  $.env = env;

  const flavourFolder = release ? "release" : "debug";

  const releaseFlag = release ? "--release" : "";

  await $`cargo build ${releaseFlag} --target=${TARGET}`;

  const wasmFileSrc = `${rootPath}/target/${TARGET}/${flavourFolder}/${name}.wasm`;
  const wasmFilDest = path.join(outDir, `${name}.wasm`);
  await mkdirp(outDir);
  // await fs.copyFile(wasmFileSrc, wasmFilDest);

  const asyncifyFlag = asyncify ? "--asyncify" : "";
  const debuginfoFlag = debuginfo ? "--debuginfo" : "";
  await $`wasm-opt -O3 ${wasmFileSrc} ${asyncifyFlag} -o ${wasmFilDest}  ${debuginfoFlag}`;

  return wasmFilDest;
}

/**
 *
 * @param {string | undefined} rootPath
 * @returns {Record<string,string>}
 */
async function getEnv(rootPath) {
  const wasiSdkPath = await getWasiSdkPath(rootPath);

  const binaryenPath = await prepareBinaryen(rootPath);

  const env = {
    ...process.env,
  };

  if (binaryenPath) {
    env.PATH = `${binaryenPath}${PATH_SEPARATOR}${env.PATH}`;
  }

  env.CC = `${wasiSdkPath}/bin/clang -D_WASI_EMULATED_MMAN --sysroot=${wasiSdkPath}/share/wasi-sysroot`;
  env.LLD = `${wasiSdkPath}/bin/lld -lwasi-emulated-mman`;
  env.LD = `${env.LLD}`;
  env.AR = `${wasiSdkPath}/bin/llvm-ar`;
  env.NM = `${wasiSdkPath}/bin/llvm-nm`;

  const libgccFile = (await $`${wasiSdkPath}/bin/clang -print-libgcc-file-name`).stdout.trim();
  env.RUSTFLAGS = `-C link-arg=${libgccFile}`

  env.TARGET = `wasm32-wasi`;
  return env;
}

/**
 *
 * @param {string} name
 */
export async function lintRust(name) {
  const rootPath = (await $`git rev-parse --show-toplevel`).stdout.trim();

  const env = await getEnv(rootPath);
  $.env = env;
  await $`cargo clippy --target=${env.TARGET} --package=${name} --no-deps`;
}

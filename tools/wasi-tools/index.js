import "zx/globals";

import { mkdirp } from "mkdirp";
import { $ } from "zx";
import path from "upath";
import { getWasiSdkPath } from "./wasi-sdk.js";
import { prepareBinaryen } from "./binaryen.js";

const PATH_SEPARATOR = process.platform === "win32" ? ";" : ":";
const EXE_EXTENSION = process.platform === "win32" ? ".exe" : "";

const windowsGitBashPath = "C:\\Program Files\\Git\\bin\\bash.exe";
if (process.platform === "win32" && fs.existsSync(windowsGitBashPath)) {
  $.shell = windowsGitBashPath;
}

export function configure(verbose) {
  $.verbose = verbose;
}

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
 * @property {string | undefined} [bin] - A specific binary to build.
 * @property {string[] | undefined} [features] - A list of features to enable.
 * @property {boolean | undefined} [wasmOpt] - Whether to run wasm-opt. Defaults to true.
 */

/**
 * Build the rust project of the current directory for the wasm32-wasi target.
 * @param {BuildRustOptions} opts
 */
export async function buildRust(opts) {
  const {
    cwd = process.cwd(),
    prepare = true,
    asyncify = true,
    debuginfo = true,
    release = true,
    outDir = path.join(cwd, "dist"),
    bin,
    features,
    wasmOpt = true,
  } = opts;

  let { name = path.basename(cwd) } = opts;

  $.cwd = cwd;

  let rootPath = await getRootPath();

  const env = await getEnv(rootPath);

  if (prepare) {
    await prepareRustOnPlatform();
  }

  const TARGET = env.TARGET;

  $.env = env;

  const flavourFolder = release ? "release" : "debug";

  const releaseFlag = release ? "--release" : "";

  let cmd = `cargo build ${releaseFlag} --target=${TARGET}`;

  if (features) {
    cmd += ` --no-default-features --features="${features.join(" ")}"`;
  }

  if (bin) {
    cmd += ` --bin=${bin}`;
    name = bin;
  }

  await $([cmd]);

  let wasmFileSrc = `${rootPath}/target/${TARGET}/${flavourFolder}/${name}.wasm`;
  wasmFileSrc = path.normalizeSafe(wasmFileSrc);
  let wasmFilDest = path.join(outDir, `${name}.wasm`);
  wasmFilDest = path.normalizeSafe(wasmFilDest);

  await mkdirp(outDir);
  // await fs.copyFile(wasmFileSrc, wasmFilDest);

  if (wasmOpt) {
    const asyncifyFlag = asyncify ? "--asyncify" : "";
    const debuginfoFlag = debuginfo ? "--debuginfo" : "";

    // IMPORTANT: seems like any optimization level higher than "-O1" breaks the wasm file
    await $`wasm-opt -O1 ${wasmFileSrc} ${asyncifyFlag} -o ${wasmFilDest}  ${debuginfoFlag}`;
  } else {
    await fs.copyFile(wasmFileSrc, wasmFilDest);
  }

  return wasmFilDest;
}

async function getRootPath() {
  let rootPath = (await $`git rev-parse --show-toplevel`).stdout.trim();
  rootPath = path.normalizeSafe(rootPath);
  rootPath = path.toUnix(rootPath);
  return rootPath;
}

/**
 * @typedef {Object} BuildCOptions
 * @property {string  | undefined} [cwd] - The directory to run the rust build command in. Defaults to the current directory.
 * @property {string | string[] | undefined} [input] - The input file or files to build. Defaults to `main.c`.
 * @property {string | undefined} [output] - The path to output the wasm file to. Defaults to `dist/main.wasm`.
 * @property {boolean | undefined} [asyncify] - Whether to run wasm-opt with the --asyncify flag. Defaults to true.
 * @property {boolean | undefined} [debuginfo] - Whether to run wasm-opt with the --debuginfo flag. Defaults to true.
 */

/**
 * Build a c project for the wasm32-wasi target.
 * @param {BuildCOptions} opts
 */
export async function buildC(opts) {
  const {
    cwd = process.cwd(),
    asyncify = true,
    debuginfo = true,
    output = path.join(cwd, "dist", "main.wasm"),
    input = "main.c",
  } = opts;

  $.cwd = cwd;

  const rootPath = await getRootPath();

  const env = await getEnv(rootPath);

  const TARGET = env.TARGET;

  $.env = env;

  await mkdirp(path.dirname(output));

  await $`clang --target=${TARGET} ${input} -o ${output}`;

  const asyncifyFlag = asyncify ? "--asyncify" : "";
  const debuginfoFlag = debuginfo ? "--debuginfo" : "";
  await $`wasm-opt -O3 ${output} ${asyncifyFlag} -o ${output}  ${debuginfoFlag}`;

  return output;
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

  if (wasiSdkPath) {
    let wasiSdkBinPath = path.join(wasiSdkPath, "bin");
    if (process.platform === "win32") {
      wasiSdkBinPath = wasiSdkBinPath.replace(/\//g, "\\");
    }

    env.PATH = `${wasiSdkBinPath}${PATH_SEPARATOR}${env.PATH}`;
  }

  if (binaryenPath) {
    let binaryenBinPath = path.join(binaryenPath);
    if (process.platform === "win32") {
      binaryenBinPath = binaryenBinPath.replace(/\//g, "\\");
    }
    env.PATH = `${binaryenBinPath}${PATH_SEPARATOR}${env.PATH}`;
  }

  env.CC = `${wasiSdkPath}/bin/clang${EXE_EXTENSION} -D_WASI_EMULATED_MMAN --sysroot=${wasiSdkPath}/share/wasi-sysroot`;
  env.LLD = `${wasiSdkPath}/bin/lld${EXE_EXTENSION} -lwasi-emulated-mman`;
  env.LD = `${env.LLD}`;
  env.AR = `${wasiSdkPath}/bin/llvm-ar${EXE_EXTENSION}`;
  env.NM = `${wasiSdkPath}/bin/llvm-nm${EXE_EXTENSION}`;

  const libgccFile = path.join(
    wasiSdkPath,
    "lib",
    "clang",
    "16",
    "lib",
    "wasi",
    "libclang_rt.builtins-wasm32.a",
  );

  env.RUSTFLAGS = `-C link-arg=${libgccFile}`;

  env.TARGET = `wasm32-wasi`;
  return env;
}

/**
 *
 * @param {string} name
 */
export async function lintRust(name) {
  const rootPath = await getRootPath();

  await prepareRustOnPlatform();
  const env = await getEnv(rootPath);
  $.env = env;
  await $`cargo clippy --target=${env.TARGET} --package=${name} --no-deps`;
}

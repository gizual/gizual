import "zx/globals";

import download from "download";
import { mkdirp } from "mkdirp";
import { $, argv, fs, path, spinner, which } from "zx";

let { stdout: rootPath } = await $`git rev-parse --show-toplevel`;
rootPath = rootPath.trim();

const PATH_SEPARATOR = process.platform === "win32" ? ";" : ":";
const EXE_SUFFIX = process.platform === "win32" ? ".exe" : "";

// WASI SDK ------------------------------------------------------------------

const WASI_SDK_URL_BASE = "https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/";
const WASI_SDK_URL = {
  darwin: `${WASI_SDK_URL_BASE}/wasi-sdk-20.0-macos.tar.gz`,
  win32: `${WASI_SDK_URL_BASE}/wasi-sdk-20.0.m-mingw.tar.gz`,
};

async function installWasiSdk() {
  if (process.env["WASI_SDK_PATH"]) {
    return process.env["WASI_SDK_PATH"];
  }

  const wasiSdkPath = `${rootPath}/.cache/tools/wasi-sdk`;

  if (fs.existsSync(path.join(wasiSdkPath, "bin", `clang${EXE_SUFFIX}`))) {
    return wasiSdkPath;
  }

  const url = WASI_SDK_URL[process.platform];
  if (!url) {
    throw new Error(
      `wasi-sdk not found at env WASI_SDK_PATH and not found for platform: "${process.platform}"`,
    );
  }

  await mkdirp(wasiSdkPath);

  await spinner(`downloading wasi-sdk to ${wasiSdkPath}`, async () => {
    await download(url, wasiSdkPath, { extract: true, strip: 1 });
  });

  return wasiSdkPath;
}

// BINARYEN ------------------------------------------------------------------

const BINARYEN_URL_BASE = "https://github.com/WebAssembly/binaryen/releases/download/version_114";
const BINARYEN_URL = {
  darwin: `${BINARYEN_URL_BASE}/binaryen-version_114-arm64-macos.tar.gz`,
  win32: `${BINARYEN_URL_BASE}/binaryen-version_114-x86_64-windows.tar.gz`,
};

async function installBinaryen() {
  try {
    const result = await which("wasm-opt");
    if (result) {
      return;
    }
  } catch {
    // noop
  }
  const binaryenPath = `${rootPath}/.cache/tools/binaryen`;
  const binaryenBinPath = `${binaryenPath}/bin`;

  if (fs.existsSync(binaryenBinPath)) {
    return binaryenBinPath;
  }

  const url = BINARYEN_URL[process.platform];
  if (!url) {
    throw new Error(`binaryen not found on PATH and not found for platform: "${process.platform}"`);
  }

  await mkdirp(binaryenPath);

  await spinner(`downloading binaryen to ${binaryenPath}`, async () => {
    await download(url, binaryenPath, { extract: true, strip: 1 });
  });

  return binaryenBinPath;
}

// MAIN ----------------------------------------------------------------------

const command = argv._[0];

const env = {
  ...process.env,
  // RUSTFLAGS: `-Z wasi-exec-model=reactor`
};

if (process.platform === "win32") {
  const gitPath = await which("git");
  if (!gitPath) {
    throw new Error("git not found on PATH");
  }
  const gitDir = path.dirname(gitPath);

  env.PATH = `${gitDir}${PATH_SEPARATOR}${env.PATH}`;
}

const wasiSdkPath = await installWasiSdk();
env.WASI_SDK_PATH = wasiSdkPath;
$.log(`Using wasi-sdk from ${wasiSdkPath}`);

const binaryenBinPath = await installBinaryen();

if (binaryenBinPath) {
  $.log(`Using binaryen from ${binaryenBinPath}`);
  env.PATH = `${binaryenBinPath}${PATH_SEPARATOR}${env.PATH}`;
} else {
  $.log(`Using binaryen from PATH`);
}

env.CC = `${wasiSdkPath}/bin/clang -D_WASI_EMULATED_MMAN --sysroot=${wasiSdkPath}/share/wasi-sysroot`;
env.LLD = `${wasiSdkPath}/bin/lld -lwasi-emulated-mman`;
env.LD = `${env.LLD}`;
env.AR = `${wasiSdkPath}/bin/llvm-ar`;
env.NM = `${wasiSdkPath}/bin/llvm-nm`;

const TARGET = `wasm32-wasi`;
env.TARGET = TARGET;

$.env = env;

switch (command) {
  case "build": {
    if (process.platform === "win32") {
      await $`rustup toolchain install stable-x86_64-pc-windows-gnu --force-non-host`;
      await $`rustup override set stable-x86_64-pc-windows-gnu`;
      await $`rustup target add x86_64-pc-windows-gnu`;
    }
    await $`rustup target add ${TARGET}`;
    await $`cargo build --release --target=${TARGET}`;

    const wasmFileSrc = `${rootPath}/target/${TARGET}/release/explorer-backend-libgit2.wasm`;
    const wasmFilDest = `dist/explorer-backend-libgit2.wasm`;
    await mkdirp(path.join(rootPath, "dist"));
    await mkdirp(path.join(__dirname, "dist"));

    await fs.copyFile(wasmFileSrc, wasmFilDest);
    await $`wasm-opt -O3 ${wasmFileSrc} --asyncify -o ${wasmFilDest}  --debuginfo`;
    break;
  }
  case "lint": {
    await $`cargo clippy --target=${TARGET} --package=explorer-backend-libgit2 --no-deps`;
    break;
  }
  default: {
    console.error(`unknown command: ${command}`);
    break;
  }
}

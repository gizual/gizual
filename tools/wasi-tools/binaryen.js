import "zx/globals";
import { mkdirp } from "mkdirp";
import download from "download";


const BINARYEN_URL_BASE = "https://github.com/WebAssembly/binaryen/releases/download/version_114";
const BINARYEN_URL = {
  darwin: `${BINARYEN_URL_BASE}/binaryen-version_114-arm64-macos.tar.gz`,
  win32: `${BINARYEN_URL_BASE}/binaryen-version_114-x86_64-windows.tar.gz`,
  linux: `${BINARYEN_URL_BASE}/binaryen-version_114-x86_64-linux.tar.gz`,
};



/**
 * 
 * @param {string | undefined} rootPath
 * @returns {string}
 */
export async function installBinaryen(rootPath) {

  rootPath = rootPath  ?? (await $`git rev-parse --show-toplevel`).stdout.trim();

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


async function isBinaryenInstalled() {
  try {
    const result = await which("wasm-opt");
    if (result) {
      return true;
    }
  } catch {
    // noop
  }
  return false;
}


/**
 * @param {string | undefined} rootPath
 * @returns {string | undefined} Path to binaryen bin folder if binaryen is installed manually
 */
export async function prepareBinaryen(rootPath) {
  if (await isBinaryenInstalled()) {
    return;
  }

  const binaryenBinPath = await installBinaryen(rootPath);
  return binaryenBinPath;
}
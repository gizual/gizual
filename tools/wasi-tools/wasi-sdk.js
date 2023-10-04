const WASI_SDK_URL_BASE = "https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/";
const WASI_SDK_URL = {
  darwin: `${WASI_SDK_URL_BASE}/wasi-sdk-20.0-macos.tar.gz`,
  win32: `${WASI_SDK_URL_BASE}/wasi-sdk-20.0.m-mingw.tar.gz`,
};

/**
 * 
 * @param {string | undefined} rootPath 
 * @returns {string}
 */
export async function getWasiSdkPath(rootPath) {
    rootPath = rootPath  ?? (await $`git rev-parse --show-toplevel`).stdout.trim();

  if (process.env["WASI_SDK_PATH"]) {
    return process.env["WASI_SDK_PATH"];
  }

  const wasiSdkPath = `${rootPath}/.cache/tools/wasi-sdk`;

  if (fs.existsSync(path.join(wasiSdkPath, "bin"))) {
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

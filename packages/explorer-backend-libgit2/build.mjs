import "zx/globals";

// eslint-disable-next-line turbo/no-undeclared-env-vars
if (!process.env.WASI_SDK_PATH) {
  console.error(`env "WASI_SDK_PATH" not defined`);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

const WASI_SDK_PATH = process.env.WASI_SDK_PATH;

console.log(`env:`);
console.log(`WASI_SDK_PATH: ${WASI_SDK_PATH}`);

const CC = `${WASI_SDK_PATH}/bin/clang -D_WASI_EMULATED_MMAN --sysroot=${WASI_SDK_PATH}/share/wasi-sysroot`;
const LLD = `${WASI_SDK_PATH}/bin/lld -lwasi-emulated-mman`;
const LD = `${LLD}`;
const AR = `${WASI_SDK_PATH}/bin/llvm-ar`;
const NM = `${WASI_SDK_PATH}/bin/llvm-nm`;
const TARGET = `wasm32-wasi`;

$.env = {
  ...process.env,
  CC,
  LLD,
  LD,
  AR,
  NM,
  TARGET,
};

await $`rustup target add ${TARGET}`;
await $`cargo build -r --target=${TARGET}`;

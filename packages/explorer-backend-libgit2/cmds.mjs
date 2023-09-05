import "zx/globals";

import { buildRust, lintRust } from "@giz/rust-wasi-tools";
import { argv } from "zx";

const command = argv._[0];

const pkgName = "explorer-backend-libgit2";

switch (command) {
  case "build": {
    await buildRust({
      cwd: __dirname,
      name: pkgName,
    });
    break;
  }
  case "lint": {
    await lintRust(pkgName);
    break;
  }
  default: {
    console.error(`unknown command: ${command}`);
    break;
  }
}

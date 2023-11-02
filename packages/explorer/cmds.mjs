import "zx/globals";

import { buildRust, lintRust } from "@giz/wasi-tools";
import { argv } from "zx";

const command = argv._[0];

const pkgName = "explorer";

switch (command) {
  case "build": {
    await buildRust({
      cwd: __dirname,
      name: pkgName,
    });
    // TODO tsup typescript sources
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

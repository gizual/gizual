import { ILogObj, Logger as TsLogger } from "tslog";

export const LOG: TsLogger<ILogObj> = new TsLogger({
  minLevel: 1, // 0 = silly, 1 = trace, 2 = debug, 3 = info, 4 = warn, 5 = error, 6 = fatal
  prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}} {{name}}:\t",
  prettyLogStyles: {
    logLevelName: {
      "*": ["bold", "black", "bgWhiteBright", "dim"],
      SILLY: ["bold", "white", "bgBlackBright"],
      TRACE: ["bold", "whiteBright", "bgBlackBright"],
      DEBUG: ["bold", "green"],
      INFO: ["bold", "blue"],
      WARN: ["bold", "yellow"],
      ERROR: ["bold", "red"],
      FATAL: ["bold", "redBright"],
    },
  },
});
export type Logger = TsLogger<ILogObj>;

import { Logger } from "@giz/logger";

export const debugWrapImports = (imports: Record<string, any>, parentLogger: Logger) => {
  const logger = parentLogger.getSubLogger({ name: "wasi-calls" });
  const debugImports: Record<string, Record<string, unknown>> = {};
  for (const moduleName of Object.keys(imports)) {
    debugImports[moduleName] = {};
    for (const functionName of Object.keys(imports[moduleName])) {
      debugImports[moduleName][functionName] = (...args: any[]) => {
        logger.silly("call", moduleName, functionName, args);

        const result = (imports[moduleName][functionName] as any)(...args);
        if (result && result.then) {
          return result.then((res: any) => {
            logger.silly("->", res);
            return res;
          });
        } else {
          logger.silly("->", result);
          return result;
        }
      };
    }
  }
  return debugImports;
};

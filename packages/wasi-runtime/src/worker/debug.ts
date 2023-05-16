export const debugWrapImports = (imports: Record<string, any>) => {
  const debugImports: Record<string, Record<string, unknown>> = {};
  for (const moduleName of Object.keys(imports)) {
    debugImports[moduleName] = {};
    for (const functionName of Object.keys(imports[moduleName])) {
      debugImports[moduleName][functionName] = (...args: any[]) => {
        console.log("call", moduleName, functionName, args);

        const result = (imports[moduleName][functionName] as any)(...args);
        if (result && result.then) {
          return result.then((res: any) => {
            console.log("->", res);
            return res;
          });
        } else {
          console.log("->", result);
          return result;
        }
      };
    }
  }
  return debugImports;
};

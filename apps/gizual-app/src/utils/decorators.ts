import { createLogger } from "@giz/logging";

import { getBaseConsoleCSS, getPrettyConsoleCSS } from "./console";

const logger = createLogger("decorators");

function getTimestamp(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();
  return `${hours}:${minutes}:${seconds}:${ms}`;
}

export function logWithPrefix(prefix = "[LOGGER]", bgColor = "lightblue", ...args: any[]) {
  // Specify two sets of CSS rules, such that prefix and variables can be formatted differently.
  let messageConfig = "%c%s  %c";
  const cssPrefix = getPrettyConsoleCSS(bgColor);
  const cssContent = getBaseConsoleCSS();

  let shouldInsertComma = true;
  for (const argument of args) {
    const type = typeof argument;

    switch (type) {
      case "bigint":
      case "number":
      case "boolean": {
        if (!shouldInsertComma) messageConfig += ",";
        messageConfig += "%d";
        shouldInsertComma = true;
        break;
      }
      case "string": {
        if (!shouldInsertComma) messageConfig += ",";
        messageConfig += "'%s'";
        shouldInsertComma = true;
        break;
      }
      default: {
        messageConfig += "%o";
        shouldInsertComma = false;
      }
    }
  }

  logger.log(messageConfig, cssPrefix, prefix, cssContent, ...args);
}

export function loggedMethod(prefix = "", bgColor = "lightblue") {
  return (_target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    function loggedMethod(this: any, ...args: any[]) {
      logWithPrefix(
        `[LOG: ${getTimestamp()}] ${prefix}:${propertyKey.toString()}`,
        bgColor,
        ...args,
      );
      const result = originalMethod.call(this, ...args);
      //console.log(`<app>: [${propertyKey.toString()}]: Exit.`);
      return result;
    }

    descriptor.value = loggedMethod;
    return descriptor;
  };
}

export function decorateAllMethods(decorator: MethodDecorator) {
  return (target: any) => {
    const descriptors = Object.getOwnPropertyDescriptors(target.prototype);
    for (const [propName, descriptor] of Object.entries(descriptors)) {
      const isMethod = typeof descriptor.value == "function" && propName != "constructor";
      if (!isMethod) {
        continue;
      }
      decorator(target, propName, descriptor);
      Object.defineProperty(target.prototype, propName, descriptor);
    }
  };
}

export function logAllMethods(prefix = "", bgColor = "lightblue") {
  return decorateAllMethods(loggedMethod(prefix, bgColor));
}

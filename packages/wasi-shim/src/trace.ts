import { createLogger } from "@giz/logging";

export function trace<T extends object>(obj: T): T {
  const logger = createLogger("trace");
  const proxy = new Proxy(obj, {
    get(target: any, propKey, receiver) {
      const origMethod = target[propKey];

      // eslint-disable-next-line unicorn/prefer-ternary
      if (typeof origMethod === "function") {
        const functionName = propKey.toString();

        return function (...args: any) {
          const parameters = args.join(", ");

          const functionCall = `${functionName}(${parameters})`;

          try {
            const result = origMethod.apply(target, args);
            if (result instanceof Promise) {
              logger.debug(`call async: ${functionCall}`);
              result
                .then((res) => {
                  logger.debug(`call async finished: ${functionCall} => ${res}`);
                  return res;
                })
                .catch((error) => {
                  logger.error(`call async error: ${functionCall} => ${error}`);
                  throw error;
                });
              return result;
            }
            logger.debug(`call: ${functionCall} => ${result}`);
            return result;
          } catch (error) {
            logger.error(`call error: ${functionCall} => ${error}`);
            throw error;
          }
        };
      } else {
        return origMethod;
      }
    },
  });

  return proxy;
}

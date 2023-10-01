// write a function witch wraps an object of functions and exposes the same functions, but with logs for each call , arguments and return values, also promises

export function trace<T extends object>(obj: T): T {
  const proxy = new Proxy(obj, {
    get(target, propKey, receiver) {
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
              console.debug(`call async: ${functionCall}`);
              result
                .then((res) => {
                  console.debug(`call async finished: ${functionCall} => ${res}`);
                  return res;
                })
                .catch((error) => {
                  console.error(`call async error: ${functionCall} => ${error}`);
                  throw error;
                });
              return result;
            }
            console.debug(`call: ${functionCall} => ${result}`);
            return result;
          } catch (error) {
            console.error(`call error: ${functionCall} => ${error}`);
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

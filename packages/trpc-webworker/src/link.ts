import { AnyRouter } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { TRPCRequestMessage, TRPCResponseMessage } from "@trpc/server/rpc";

import { TRPCClientError } from "@trpc/client";
import { transformResult } from "@trpc/client/shared";

import { TRPCLink } from "@trpc/client";

interface WebWorkerLinkOptions {
  port: Worker | MessagePort;
}

export function webworkerLink<TRouter extends AnyRouter>(
  opts: WebWorkerLinkOptions,
): [TRPCLink<TRouter>, dispose: () => void] {
  const { port: worker } = opts;

  let eventListeners: ((evt: MessageEvent) => void)[] = [];

  worker.onmessage = (evt) => {
    eventListeners.forEach((listener) => listener(evt));
  };

  const link: TRPCLink<TRouter> =
    (runtime) =>
    ({ op }) =>
      observable((observer) => {
        const { path, id, type } = op;
        const input = runtime.transformer.serialize(op.input);

        const msg: TRPCRequestMessage = {
          id,
          jsonrpc: "2.0",
          method: type,
          params: {
            path,
            input,
          },
        };

        const onMessage = (event: MessageEvent<TRPCResponseMessage>) => {
          const response = event.data;
          if (response.id === msg.id) {
            const transformed = transformResult(response, runtime);

            if (!transformed.ok) {
              observer.error(TRPCClientError.from(transformed.error));
              return;
            }
            observer.next({
              result: transformed.result,
            });
            observer.complete();
          }
        };

        eventListeners.push(onMessage);

        worker.postMessage(msg);

        return () => {
          eventListeners = eventListeners.filter((listener) => listener !== onMessage);
        };
      });

  return [
    link,
    () => {
      eventListeners = [];
      if (worker instanceof Worker) {
        worker.terminate();
      }

      if (worker instanceof MessagePort) {
        worker.close();
      }
    },
  ];
}

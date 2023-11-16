import type { AnyRouter, ProcedureType, inferRouterError } from "@trpc/server";
import { Observer, UnsubscribeFn, observable } from "@trpc/server/observable";
import {
  TRPCClientIncomingMessage,
  TRPCRequestMessage,
  TRPCResponseMessage,
} from "@trpc/server/rpc";

import { Operation, TRPCClientError } from "@trpc/client";
import { transformResult } from "@trpc/client/shared";

import { TRPCLink } from "@trpc/client";

type WSCallbackResult<TRouter extends AnyRouter, TOutput> = TRPCResponseMessage<
  TOutput,
  inferRouterError<TRouter>
>;

type WSCallbackObserver<TRouter extends AnyRouter, TOutput> = Observer<
  WSCallbackResult<TRouter, TOutput>,
  TRPCClientError<TRouter>
>;

type TCallbacks = WSCallbackObserver<AnyRouter, unknown>;

type TRequest = {
  type: ProcedureType;
  callbacks: TCallbacks;
  op: Operation;
};

interface WebWorkerLinkOptions {
  port: Worker | MessagePort;
}

export function createWebWorkerClient(opts: WebWorkerLinkOptions) {
  const { port: worker } = opts;

  worker.onmessage = (evt) => {
    const msg: TRPCClientIncomingMessage = evt.data;

    if ("method" in msg) {
      throw new Error("Unexpected incoming message");
    } else {
      handleIncomingResponse(msg);
    }
  };

  const pendingRequests: Record<number | string, TRequest> = Object.create(null);

  const handleIncomingResponse = (data: TRPCResponseMessage) => {
    const req = data.id !== null && pendingRequests[data.id];
    if (!req) {
      return;
    }

    req.callbacks.next?.(data);

    if ("result" in data && data.result.type === "stopped") {
      req.callbacks.complete();
    }
  };

  function request(op: Operation, callbacks: TCallbacks): UnsubscribeFn {
    const { type, input, path, id } = op;
    const envelope: TRPCRequestMessage = {
      id,
      method: type,
      params: {
        input,
        path,
      },
    };
    pendingRequests[id] = {
      type,
      callbacks,
      op,
    };

    worker.postMessage(envelope);

    return () => {
      const callbacks = pendingRequests[id]?.callbacks;
      delete pendingRequests[id];

      callbacks?.complete?.();
      if (op.type === "subscription") {
        worker.postMessage({
          id,
          method: "subscription.stop",
        });
      }
    };
  }

  return {
    request,
    handleIncomingResponse,
    dispose: () => {
      if (worker instanceof Worker) {
        worker.terminate();
      }

      if (worker instanceof MessagePort) {
        worker.close();
      }
    },
  };
}

export function webWorkerLink<TRouter extends AnyRouter>(
  opts: WebWorkerLinkOptions,
): [TRPCLink<TRouter>, dispose: () => void] {
  const client = createWebWorkerClient(opts);

  const link: TRPCLink<TRouter> = (runtime) => {
    return ({ op }) => {
      return observable((observer) => {
        const { type, path, id, context } = op;

        const input = runtime.transformer.serialize(op.input);

        const unsub = client.request(
          { type, path, input, id, context },
          {
            error(err) {
              observer.error(err as TRPCClientError<any>);
              unsub();
            },
            complete() {
              observer.complete();
            },
            next(message) {
              const transformed = transformResult(message, runtime);

              if (!transformed.ok) {
                observer.error(TRPCClientError.from(transformed.error));
                return;
              }
              observer.next({
                result: transformed.result,
              });

              if (op.type !== "subscription") {
                // if it isn't a subscription we don't care about next response

                unsub();
                observer.complete();
              }
            },
          },
        );
        return () => {
          unsub();
        };
      });
    };
  };

  return [link, () => client.dispose()];
}

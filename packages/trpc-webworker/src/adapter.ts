/// <reference lib="webworker" />
import {
  AnyRouter,
  callProcedure,
  ProcedureType,
  getTRPCErrorFromUnknown,
  TRPCError,
} from "@trpc/server";
import { isObservable, Unsubscribable } from "@trpc/server/observable";

import {
  JSONRPC2,
  parseTRPCMessage,
  TRPCClientOutgoingMessage,
  TRPCResponseMessage,
} from "@trpc/server/rpc";

import { getErrorShape, transformTRPCResponse } from "@trpc/server/shared";

export type WebWorkerHandlerOptions<TRouter extends AnyRouter> = {
  router: TRouter;
  port: DedicatedWorkerGlobalScope | MessagePort;
};

export function applyWebWorkerHandler<TRouter extends AnyRouter>(
  opts: WebWorkerHandlerOptions<TRouter>,
) {
  const { router, port: worker } = opts;
  const { transformer } = router._def._config;
  const clientSubscriptions = new Map<number | string, Unsubscribable>();

  function respond(untransformedJSON: TRPCResponseMessage) {
    worker.postMessage(transformTRPCResponse(router._def._config, untransformedJSON));
  }

  function stopSubscription(
    subscription: Unsubscribable,
    { id, jsonrpc }: JSONRPC2.BaseEnvelope & { id: JSONRPC2.RequestId },
  ) {
    subscription.unsubscribe();

    respond({
      id,
      jsonrpc,
      result: {
        type: "stopped",
      },
    });
  }

  async function handleRequest(msg: TRPCClientOutgoingMessage) {
    const { id, method, jsonrpc } = msg;

    if (id === null) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "`id` is required",
      });
    }

    if (method === "subscription.stop") {
      const sub = clientSubscriptions.get(id);
      if (sub) {
        stopSubscription(sub, { id, jsonrpc });
      }
      clientSubscriptions.delete(id);
      return;
    }

    const { params } = msg;
    const { path, input } = params;
    const type = method as ProcedureType;

    const result = await callProcedure({
      procedures: router._def.procedures,
      path,
      getRawInput: () => Promise.resolve(input),
      //rawInput: input,
      ctx: undefined,
      type,
    });

    if (type !== "subscription") {
      respond({
        id,
        jsonrpc,
        result: {
          type: "data",
          data: transformer.output.serialize(result),
        },
      });
      return;
    }

    if (!isObservable(result)) {
      throw new TRPCError({
        message: `Subscription ${path} did not return an observable`,
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    const observable = result;
    const sub = observable.subscribe({
      next(data) {
        respond({
          id,
          jsonrpc,
          result: {
            type: "data",
            data,
          },
        });
      },
      error(err) {
        const error = getTRPCErrorFromUnknown(err);
        respond({
          id,
          jsonrpc,
          error: getErrorShape({
            config: router._def._config,
            error,
            type,
            path,
            input,
            ctx: undefined,
          }),
        });
      },
      complete() {
        respond({
          id,
          jsonrpc,
          result: {
            type: "stopped",
          },
        });
      },
    });

    if (clientSubscriptions.has(id)) {
      // duplicate request ids for client
      stopSubscription(sub, { id, jsonrpc });
      throw new TRPCError({
        message: `Duplicate id ${id}`,
        code: "BAD_REQUEST",
      });
    }
    clientSubscriptions.set(id, sub);

    respond({
      id,
      jsonrpc,
      result: {
        type: "started",
      },
    });
  }

  worker.onmessage = async (event) => {
    try {
      await handleRequest(parseTRPCMessage(event.data, transformer));
    } catch (cause) {
      const error = getTRPCErrorFromUnknown(cause);
      respond({
        id: null,
        jsonrpc: "2.0",
        error: getErrorShape({
          config: router._def._config,
          error,
          type: "unknown",
          path: undefined,
          input: undefined,
          ctx: undefined,
        }),
      });
    }
  };
}

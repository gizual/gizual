/// <reference lib="webworker" />
import { AnyRouter, callProcedure, ProcedureType, getTRPCErrorFromUnknown } from "@trpc/server";

import { parseTRPCMessage, TRPCClientOutgoingMessage } from "@trpc/server/rpc";

import { getErrorShape } from "@trpc/server/shared";

export type WebWorkerHandlerOptions<TRouter extends AnyRouter> = {
  router: TRouter;
  port: DedicatedWorkerGlobalScope | MessagePort;
};

export function applyWebWorkerHandler<TRouter extends AnyRouter>(
  opts: WebWorkerHandlerOptions<TRouter>,
) {
  const { router, port: worker } = opts;
  const { transformer } = router._def._config;

  async function handleRequest(msg: TRPCClientOutgoingMessage) {
    if (msg.method === "subscription.stop") {
      // nothing prevents us to implement subscriptions here,
      // but I can't see a use case for it now
      return;
    }

    const { id, method, params, jsonrpc } = msg;
    const { path, input } = params;
    const type = method as ProcedureType;

    try {
      const result = await callProcedure({
        procedures: router._def.procedures,
        path,
        getRawInput: () => Promise.resolve(input),
        //rawInput: input,
        ctx: undefined,
        type,
      });

      worker.postMessage({
        id,
        jsonrpc,
        result: {
          type: "data",
          data: transformer.output.serialize(result),
        },
      });
    } catch (cause) {
      const error = getTRPCErrorFromUnknown(cause);
      worker.postMessage({
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
    }
  }

  worker.onmessage = async (event) => {
    try {
      await handleRequest(parseTRPCMessage(event.data, transformer));
    } catch (cause) {
      const error = getTRPCErrorFromUnknown(cause);
      worker.postMessage({
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

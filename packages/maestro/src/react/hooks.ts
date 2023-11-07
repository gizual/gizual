import { CreateTRPCReact } from "@trpc/react-query";
import React from "react";

import type { AppRouter } from "../maestro-worker";

import { TrpcContext } from "./providers";

export function useTrpc(): CreateTRPCReact<AppRouter, unknown, ""> {
  return React.useContext(TrpcContext);
}

export function useAuthorList(limit?: number, offset?: number) {
  const trpc = useTrpc();

  return trpc.authorList.useQuery({ limit, offset });
}

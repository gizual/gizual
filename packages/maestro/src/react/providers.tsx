import { keepPreviousData, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateTRPCReact, createTRPCReact } from "@trpc/react-query";
import React from "react";

import { Maestro } from "../maestro";
import type { AppRouter } from "../maestro-worker";

export type MaestroProvidersOpts = {
  maestro: Maestro;
  children: React.ReactNode;
};

export const TrpcContext: React.Context<CreateTRPCReact<AppRouter, unknown, "">> =
  React.createContext<CreateTRPCReact<AppRouter, unknown, "">>(undefined!);

export function MaestroProvider({ maestro, children }: MaestroProvidersOpts) {
  const [trpc] = React.useState(() => createTRPCReact<AppRouter>());
  const [queryClient] = React.useState(
    () => new QueryClient({ defaultOptions: { queries: { placeholderData: keepPreviousData } } }),
  );
  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [maestro.link],
    }),
  );

  return (
    <TrpcContext.Provider value={trpc}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </TrpcContext.Provider>
  );
}

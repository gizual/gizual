import React from "react";

import { Maestro } from "../maestro";

export type MaestroProvidersOpts = {
  maestro: Maestro;
  children: React.ReactNode;
};

export const MaestroContext = React.createContext<Maestro>(undefined!);

export function MaestroProvider({ maestro, children }: MaestroProvidersOpts) {
  return <MaestroContext.Provider value={maestro}>{children}</MaestroContext.Provider>;
}

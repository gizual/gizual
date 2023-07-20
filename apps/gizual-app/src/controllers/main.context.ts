import React from "react";

import { MainController } from "./main.controller";

export const MainContext = React.createContext<MainController | undefined>(undefined);

export const useMainController = (): MainController => {
  const ctx = React.useContext(MainContext);

  if (!ctx) {
    throw new Error("unable to access MainController");
  }

  return ctx;
};

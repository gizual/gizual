import React from "react";

import { MainController } from "./main.controller";
import { ViewModelController } from "./vm.controller";

export const MainContext = React.createContext<MainController | undefined>(undefined);

export const useMainController = (): MainController => {
  const ctx = React.useContext(MainContext);

  if (!ctx) {
    throw new Error("Unable to consume MainController context");
  }

  return ctx;
};

export const useViewModelController = (): ViewModelController => {
  const ctx = React.useContext(MainContext);

  if (!ctx) {
    throw new Error("Unable to consume MainController context");
  }

  return ctx.vmController;
};

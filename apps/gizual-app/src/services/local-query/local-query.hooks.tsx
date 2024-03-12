import React from "react";

import { LocalQueryContext } from "./local-query.context";

export const useLocalQuery = () => {
  const queryManager = React.useContext(LocalQueryContext);

  if (!queryManager) {
    throw new Error("Unable to consume LocalQueryContext - no query manager found.");
  }

  return queryManager;
};

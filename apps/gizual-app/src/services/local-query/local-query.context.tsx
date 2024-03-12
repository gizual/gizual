import { createContext } from "react";

import { LocalQueryManager } from "./local-query";

const LocalQueryContext = createContext<LocalQueryManager | undefined>(undefined);

export { LocalQueryContext };

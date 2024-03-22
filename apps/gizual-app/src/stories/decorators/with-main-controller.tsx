import { MainContext, MainController } from "@app/controllers";
import { LocalQueryContext, useNewLocalQuery } from "@app/utils";
import type { StoryContext, StoryFn } from "@storybook/react";
import React from "react";

import { Maestro } from "@giz/maestro";
import { MaestroProvider } from "@giz/maestro/react";

const maestro = new Maestro();

await maestro.setup();

const mainController = new MainController(maestro);

(window as any).mainController = mainController;

const withMainController = (Story: StoryFn, context: StoryContext) => {
  const [mainController, setMainController] = React.useState<MainController>();
  React.useEffect(() => {
    const maestro = new Maestro();
    maestro.setup().then(() => {
      setMainController(new MainController(maestro));
    });
  }, []);

  // While promise is pending, render nothing
  if (!mainController) {
    return <div>Initializing maestro context ...</div>;
  }

  return (
    <MaestroProvider maestro={maestro}>
      <MainContext.Provider value={mainController}>
        <LocalQueryContextProvider>
          <Story {...context} />
        </LocalQueryContextProvider>
      </MainContext.Provider>
    </MaestroProvider>
  );
};

function LocalQueryContextProvider({ children }: { children: React.ReactNode }) {
  const { localQuery, publishLocalQuery, updateLocalQuery } = useNewLocalQuery();

  return (
    <LocalQueryContext.Provider value={{ localQuery, publishLocalQuery, updateLocalQuery }}>
      {children}
    </LocalQueryContext.Provider>
  );
}

export default withMainController;

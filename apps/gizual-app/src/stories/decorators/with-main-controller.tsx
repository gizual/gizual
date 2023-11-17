import { MainContext, MainController } from "@app/controllers";
import type { StoryContext, StoryFn } from "@storybook/react";

import { Maestro } from "@giz/maestro";

const withMainController = (Story: StoryFn, context: StoryContext) => {
  const maestro = new Maestro();
  const mainController = new MainController(maestro);

  return (
    <MainContext.Provider value={mainController}>
      <Story {...context} />
    </MainContext.Provider>
  );
};

export default withMainController;

import { TypeModuleComponent } from "@app/primitives/query-input/simple/modules/type/type-module";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "SimpleQuery - Modules/Vis Type Module",
  component: TypeModuleComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMantineProvider, withMainController],
} satisfies Meta<typeof TypeModuleComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VisTypeModule: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxHeight: "48px" }}>
        <Story />
      </div>
    ),
  ],
};

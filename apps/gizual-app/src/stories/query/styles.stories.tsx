import { StylePlaceholderModule } from "@app/primitives/query-input/simple/modules/styles/style-placeholder-module";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "SimpleQuery - Modules/Style Module",
  component: StylePlaceholderModule,
  parameters: {
    layout: "centered",
  },
  decorators: [withMantineProvider, withMainController],
} satisfies Meta<typeof StylePlaceholderModule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StyleModule: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxHeight: "48px" }}>
        <Story />
      </div>
    ),
  ],
};

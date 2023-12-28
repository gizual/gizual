import { TimePlaceholderModule } from "@app/primitives/query-input/simple/modules/time/time-placeholder-module";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "SimpleQuery - Modules/Time Module",
  component: TimePlaceholderModule,
  parameters: {
    layout: "centered",
  },
  decorators: [withMantineProvider, withMainController],
} satisfies Meta<typeof TimePlaceholderModule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimeModule: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxHeight: "48px" }}>
        <Story />
      </div>
    ),
  ],
};

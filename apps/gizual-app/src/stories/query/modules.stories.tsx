import { QueryBar as SimpleQueryInputComponent } from "@app/primitives/query-input";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "SimpleQuery - Modules/Simple Query Input",
  component: SimpleQueryInputComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMantineProvider, withMainController],
} satisfies Meta<typeof SimpleQueryInputComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleQueryInput: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxHeight: "80%", maxWidth: "80%" }}>
        {/* 👇 Decorators in Storybook also accept a function. Replace <Story/> with Story() to enable it  */}
        <Story />
      </div>
    ),
  ],
};

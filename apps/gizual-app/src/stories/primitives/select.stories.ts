import { Select as SelectComponent } from "@app/primitives/select";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "Primitives/Select",
  component: SelectComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider],
} satisfies Meta<typeof SelectComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Select: Story = {
  args: {
    data: Array.from({ length: 10 }, (_, i) => ({
      value: `value${i}`,
      label: `Label ${i}`,
    })),

    value: "value5",
    onChange: (value: string) => console.log(value),
  },
};

export const SelectWithPayload: Story = {
  args: {
    data: Array.from({ length: 10 }, (_, i) => ({
      value: `value${i}`,
      label: `Label ${i}`,
      payload: { name: `Payload ${i}`, content: [i] },
    })),

    value: "value5",
    onChange: (_, payload) => console.log(payload),
  },
};

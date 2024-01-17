import { FontIcon as FontIconComponent } from "@app/primitives/font-icon";
import type { Meta, StoryObj } from "@storybook/react";

import { getAllFileIcons } from "@giz/explorer-web";
import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "Primitives/FontIcon",
  component: FontIconComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider],
  argTypes: {
    name: { control: "select", options: getAllFileIcons().map((i) => i.icon) },
  },
} satisfies Meta<typeof FontIconComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FontIcon: Story = {
  args: {
    // eslint-disable-next-line unicorn/no-null
    colors: ["dark-pink", null],
    name: "ts-icon",
    style: { fontSize: "4rem" },
  },
};

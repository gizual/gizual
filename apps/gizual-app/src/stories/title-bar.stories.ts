import { TitleBar as TitleBarComponent } from "@app/primitives/title-bar";
import type { Meta, StoryObj } from "@storybook/react";

import withBackground from "./decorators/with-background";
import withMainController from "./decorators/with-main-controller";
import withMantineProvider from "./decorators/with-mantine-provider";

const meta = {
  title: "TitleBar",
  component: TitleBarComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider, withBackground],
} satisfies Meta<typeof TitleBarComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleBar: Story = {};

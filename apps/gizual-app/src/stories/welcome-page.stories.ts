import { WelcomePage as WelcomePageComponent } from "@app/pages";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "./decorators/with-main-controller";
import withMantineProvider from "./decorators/with-mantine-provider";

const meta = {
  title: "WelcomePage",
  component: WelcomePageComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider],
} satisfies Meta<typeof WelcomePageComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WelcomePage: Story = {};

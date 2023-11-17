import { WelcomePage } from "@app/pages";
import type { Meta, StoryObj } from "@storybook/react";

import withAntdConfig from "./decorators/with-antd-config";
import withMainController from "./decorators/with-main-controller";

const meta = {
  title: "WelcomePage",
  component: WelcomePage,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withAntdConfig],
} satisfies Meta<typeof WelcomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

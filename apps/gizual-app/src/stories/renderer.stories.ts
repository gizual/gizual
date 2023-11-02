import { LINEAR_COLOR_RANGE } from "@app/utils";
import type { Meta, StoryObj } from "@storybook/react";

import { Renderer } from "./renderer";

const meta = {
  title: "Renderer/Canvas",
  component: Renderer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    colorNewest: { control: "color" },
    colorOldest: { control: "color" },
    visualizationStyle: { control: "inline-radio", options: ["lineLength", "full"] },
  },
} satisfies Meta<typeof Renderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AuthorMosaic: Story = {
  args: {
    type: "author-mosaic",
  },
};

export const FileLines: Story = {
  args: {
    type: "file-lines",
    colorNewest: LINEAR_COLOR_RANGE[0],
    colorOldest: LINEAR_COLOR_RANGE[1],
    visualizationStyle: "lineLength",
  },
};

import { LINEAR_COLOR_RANGE } from "@app/utils";
import type { Meta, StoryObj } from "@storybook/react";

import { RenderType } from "@giz/file-renderer";

import { Renderer } from "./renderer";

const meta = {
  title: "Renderer",
  component: Renderer,
  parameters: {
    layout: "centered",
    //backgrounds: [{ name: "dark", value: "#000", default: true }],
  },
  tags: ["autodocs"],
  argTypes: {
    colorNewest: { control: "color" },
    colorOldest: { control: "color" },
    visualizationStyle: { control: "inline-radio", options: ["lineLength", "full"] },
    tilesPerRow: { control: "number" },
    highlightLastModifiedByAuthor: { control: "boolean" },
  },
} satisfies Meta<typeof Renderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FileLines: Story = {
  args: {
    type: RenderType.FileLines,
    colorNewest: LINEAR_COLOR_RANGE[0],
    colorOldest: LINEAR_COLOR_RANGE[1],
    visualizationStyle: "lineLength",
  },
};

export const FileMosaic: Story = {
  args: {
    type: RenderType.FileMosaic,
    colorNewest: LINEAR_COLOR_RANGE[0],
    colorOldest: LINEAR_COLOR_RANGE[1],
    tilesPerRow: 10,
  },
};

export const AuthorMosaic: Story = {
  args: {
    type: RenderType.AuthorMosaic,
    colorNewest: LINEAR_COLOR_RANGE[0],
    colorOldest: LINEAR_COLOR_RANGE[1],
    tilesPerRow: 20,
    strokeColor: "green",
    strokeWidth: 0.5,
    highlightLastModifiedByAuthor: false,
  },
};

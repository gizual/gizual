import { LINEAR_COLOR_RANGE } from "@app/utils";
import type { Meta, StoryObj } from "@storybook/react";

import { RenderType } from "@giz/file-renderer";

import { Renderer } from "./renderer";

const meta = {
  title: "Renderer",
  component: Renderer,
  parameters: {
    layout: "centered",
  },
  //tags: ["autodocs"],
  argTypes: {
    visualizationStyle: { control: "inline-radio", options: ["lineLength", "full"] },
    colorNewest: { control: "color" },
    colorOldest: { control: "color" },
    tilesPerRow: { control: "number" },
    highlightLastModifiedByAuthor: { control: "boolean" },
    numDays: { control: "number" },
  }, // Each type is it's own story
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
  parameters: {
    controls: {
      include: ["visualizationStyle", "colorOldest", "colorNewest"],
    },
  },
};

export const FileMosaic: Story = {
  args: {
    type: RenderType.FileMosaic,
    colorNewest: LINEAR_COLOR_RANGE[0],
    colorOldest: LINEAR_COLOR_RANGE[1],
    tilesPerRow: 10,
  },
  parameters: {
    controls: {
      include: ["tilesPerRow", "colorOldest", "colorNewest"],
    },
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
    mockFiles: 330,
  },
  parameters: {
    controls: {
      include: [
        "colorOldest",
        "colorNewest",
        "tilesPerRow",
        "strokeColor",
        "strokeWidth",
        "highlightLastModifiedByAuthor",
        "mockFiles",
      ],
    },
  },
};

export const AuthorContributions: Story = {
  args: {
    type: RenderType.AuthorContributions,
    colorNewest: LINEAR_COLOR_RANGE[0],
    colorOldest: LINEAR_COLOR_RANGE[1],
    mockContributions: 100,
    numDays: 365,
  },
  parameters: {
    controls: {
      include: ["colorOldest", "colorNewest", "mockContributions", "numDays"],
    },
  },
};

export const Bar: Story = {
  args: {
    type: RenderType.Bar,
    mockValues: 10,
  },
  parameters: {
    controls: {
      include: ["mockValues"],
    },
  },
};

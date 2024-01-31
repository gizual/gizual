import { Canvas as CanvasComponent } from "@app/primitives/canvas";
import type { Meta, StoryObj } from "@storybook/react";

import withDivWrapper from "./decorators/with-div-wrapper";
import withMainController from "./decorators/with-main-controller";
import withMantineProvider from "./decorators/with-mantine-provider";

const mockBlocks = Array.from({ length: 100 }, (_, index) => ({
  height: Math.random() * 1000,
  id: index.toString(),
  type: "file-lines" as const,
  filePath: "foo",
  fileType: { icon: "foo", color: ["red", "blue"] as [string, string] },
}));

const meta = {
  title: "Canvas",
  component: CanvasComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [
    withMainController,
    withMantineProvider,
    (story, ctx) =>
      withDivWrapper(story, ctx, { style: { width: "80dvw", height: "80dvh", display: "flex" } }),
  ],
} satisfies Meta<typeof CanvasComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

const Canvas: Story = {
  args: { useBlocks: () => mockBlocks, debugLayout: true },
};

export { Canvas };

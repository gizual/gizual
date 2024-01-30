import { ResizableSplitColumn as ResizableSplitColumnComponent } from "@app/primitives/resizable-split-column";
import type { Meta, StoryObj } from "@storybook/react";
import { observer } from "mobx-react-lite";
import React from "react";

import withBackground from "../decorators/with-background";
import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "Resizable Split Column",
  component: RSCStory,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider, withBackground],
} satisfies Meta<typeof RSCStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResizableSplitColumn: Story = {};

function RSCStory() {
  return (
    <ResizableSplitColumnComponent style={{ minWidth: 800, maxWidth: 800, overflow: "hidden" }}>
      <WrappedComponent
        style={{ height: 200, minWidth: 50, flexGrow: 1, backgroundColor: "green" }}
      />
      <WrappedComponent
        style={{ height: 200, minWidth: 200, flexGrow: 1, backgroundColor: "blue" }}
      />
    </ResizableSplitColumnComponent>
  );
}

const WrappedComponent = observer<any, HTMLDivElement>(
  ({ style }: { style: React.CSSProperties }, ref) => {
    return <div style={style} ref={ref} />;
  },
  { forwardRef: true },
);

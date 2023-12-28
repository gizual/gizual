import { BranchModule as BranchModuleComponent } from "@app/primitives/query-input/simple/modules/branch/branch-query-module";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "SimpleQuery - Modules/Branch Module",
  component: BranchModuleComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMantineProvider, withMainController],
} satisfies Meta<typeof BranchModuleComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BranchModule: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxHeight: "48px" }}>
        <Story />
      </div>
    ),
  ],
};

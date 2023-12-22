import { FilePlaceholderModule } from "@app/primitives/query-input/simple/modules/file/file-placeholder-module";
import type { Meta, StoryObj } from "@storybook/react";

import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "SimpleQuery - Modules/File Module",
  component: FilePlaceholderModule,
  parameters: {
    layout: "centered",
  },
  decorators: [withMantineProvider, withMainController],
} satisfies Meta<typeof FilePlaceholderModule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FileModule: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxHeight: "48px" }}>
        <Story />
      </div>
    ),
  ],
};

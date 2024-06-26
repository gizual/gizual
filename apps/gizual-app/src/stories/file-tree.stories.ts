import { FileTree as FileTreeComponent, FileTreeFlatItem } from "@app/primitives/file-tree";
import type { Meta, StoryObj } from "@storybook/react";

import { createLogger } from "@giz/logging";

import withDivWrapper from "./decorators/with-div-wrapper";
import withMainController from "./decorators/with-main-controller";
import withMantineProvider from "./decorators/with-mantine-provider";

const meta = {
  title: "FileTree",
  component: FileTreeComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider, withDivWrapper],
} satisfies Meta<typeof FileTreeComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFiles: FileTreeFlatItem[] = [
  // Root level files
  { kind: 108, path: [".eslintrc"] },
  { kind: 108, path: ["README.md"] },
  { kind: 108, path: ["package.json"] },
  { kind: 108, path: ["tsconfig.json"] },

  // 'src' directory and its contents
  { kind: "folder", path: ["src"] },
  { kind: 108, path: ["src", "index.tsx"] },
  { kind: 108, path: ["src", "index.scss"] },
  { kind: 108, path: ["src", "index.ts"] },
  { kind: "folder", path: ["src", "components"] },
  { kind: 108, path: ["src", "components", "index.ts"] },
  { kind: 108, path: ["src", "components", "index.tsx"] },
  { kind: 108, path: ["src", "components", "index.scss"] },
  // More components in 'src/components'
  ...Array.from({ length: 50 }, (_, i) => ({
    kind: "folder" as const,
    path: ["src", "components", `Component${i}`],
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    kind: 108,
    path: ["src", "components", `Component${i}`, "index.tsx"],
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    kind: 108,
    path: ["src", "components", `Component${i}`, "index.scss"],
  })),

  // 'utils' directory
  { kind: "folder", path: ["src", "utils"] },
  ...Array.from({ length: 20 }, (_, i) => ({
    kind: 108,
    path: ["src", "utils", `util${i}.ts`],
  })),

  // 'services' directory
  { kind: "folder", path: ["src", "services"] },
  ...Array.from({ length: 10 }, (_, i) => ({
    kind: 108,
    path: ["src", "services", `service${i}.ts`],
  })),

  // 'assets' directory and its contents
  { kind: "folder", path: ["src", "assets"] },
  { kind: "folder", path: ["src", "assets", "images"] },
  ...Array.from({ length: 15 }, (_, i) => ({
    kind: 108,
    path: ["src", "assets", "images", `image${i}.png`],
  })),

  { kind: "folder", path: ["src", "assets", "styles"] },
  ...Array.from({ length: 5 }, (_, i) => ({
    kind: 108,
    path: ["src", "assets", "styles", `style${i}.scss`],
  })),

  // 'tests' directory
  { kind: "folder", path: ["tests"] },
  ...Array.from({ length: 20 }, (_, i) => ({
    kind: 108,
    path: ["tests", `test${i}.spec.ts`],
  })),

  // 'docs' directory
  { kind: "folder", path: ["docs"] },
  ...Array.from({ length: 10 }, (_, i) => ({
    kind: 108,
    path: ["docs", `doc${i}.md`],
  })),
];

const logger = createLogger("FileTree");
export const FileTree: Story = {
  args: {
    mode: "full",
    files: mockFiles,
    checked: ["src/index.ts"],
    onChange: (checked) => logger.log(checked),
  },
};

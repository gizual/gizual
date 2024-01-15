import { FileTree as FileTreeComponent, FileTreeFlatItem } from "@app/primitives/file-tree";
import type { Meta, StoryObj } from "@storybook/react";

import withFixedSize from "./decorators/with-fixed-size";
import withMainController from "./decorators/with-main-controller";
import withMantineProvider from "./decorators/with-mantine-provider";

const meta = {
  title: "FileTree",
  component: FileTreeComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider, withFixedSize],
} satisfies Meta<typeof FileTreeComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFiles: FileTreeFlatItem[] = [
  // Root level files
  { kind: "file", path: [".eslintrc"] },
  { kind: "file", path: ["README.md"] },
  { kind: "file", path: ["package.json"] },
  { kind: "file", path: ["tsconfig.json"] },

  // 'src' directory and its contents
  { kind: "folder", path: ["src"] },
  { kind: "file", path: ["src", "index.tsx"] },
  { kind: "file", path: ["src", "index.scss"] },
  { kind: "file", path: ["src", "index.ts"] },
  { kind: "folder", path: ["src", "components"] },
  { kind: "file", path: ["src", "components", "index.ts"] },
  { kind: "file", path: ["src", "components", "index.tsx"] },
  { kind: "file", path: ["src", "components", "index.scss"] },
  // More components in 'src/components'
  ...Array.from({ length: 50 }, (_, i) => ({
    kind: "folder",
    path: ["src", "components", `Component${i}`],
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    kind: "file",
    path: ["src", "components", `Component${i}`, "index.tsx"],
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    kind: "file",
    path: ["src", "components", `Component${i}`, "index.scss"],
  })),

  // 'utils' directory
  { kind: "folder", path: ["src", "utils"] },
  ...Array.from({ length: 20 }, (_, i) => ({
    kind: "file",
    path: ["src", "utils", `util${i}.ts`],
  })),

  // 'services' directory
  { kind: "folder", path: ["src", "services"] },
  ...Array.from({ length: 10 }, (_, i) => ({
    kind: "file",
    path: ["src", "services", `service${i}.ts`],
  })),

  // 'assets' directory and its contents
  { kind: "folder", path: ["src", "assets"] },
  { kind: "folder", path: ["src", "assets", "images"] },
  ...Array.from({ length: 15 }, (_, i) => ({
    kind: "file",
    path: ["src", "assets", "images", `image${i}.png`],
  })),

  { kind: "folder", path: ["src", "assets", "styles"] },
  ...Array.from({ length: 5 }, (_, i) => ({
    kind: "file",
    path: ["src", "assets", "styles", `style${i}.scss`],
  })),

  // 'tests' directory
  { kind: "folder", path: ["tests"] },
  ...Array.from({ length: 20 }, (_, i) => ({
    kind: "file",
    path: ["tests", `test${i}.spec.ts`],
  })),

  // 'docs' directory
  { kind: "folder", path: ["docs"] },
  ...Array.from({ length: 10 }, (_, i) => ({
    kind: "file",
    path: ["docs", `doc${i}.md`],
  })),
];

export const FileTree: Story = {
  args: {
    mode: "full",
    files: mockFiles,
  },
};

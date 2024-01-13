import {
  LanguageDistributionChart,
  LanguageInfo,
} from "@app/charts/languages/language-distribution";
import type { Meta, StoryObj } from "@storybook/react";

import withFixedSize from "../decorators/with-fixed-size";
import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const languageDistributionMock: LanguageInfo[] = [
  {
    iconInfo: {
      color: ["#2b7489", ""],
      icon: "typescript-icon",
    },
    percentage: 0.5,
  },
  {
    iconInfo: {
      color: ["#f1e05a", ""],
      icon: "javascript-icon",
    },
    percentage: 0.2,
  },
  {
    iconInfo: {
      color: ["#00ff44", ""],
      icon: "mock-icon",
    },
    percentage: 0.3,
  },
];

const meta = {
  title: "Charts/Language Distribution",
  component: LanguageDistributionChart,
  parameters: {
    layout: "centered",
  },
  decorators: [withMainController, withMantineProvider, withFixedSize],
} satisfies Meta<typeof LanguageDistributionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LanguageDistribution: Story = {
  args: {
    languages: languageDistributionMock,
  },
};

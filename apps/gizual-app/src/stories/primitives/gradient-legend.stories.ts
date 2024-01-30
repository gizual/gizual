import { GradientLegend as GradientLegendComponent } from "@app/primitives/gradient-legend";
import type { Meta, StoryObj } from "@storybook/react";

//import withDivWrapper from "../decorators/with-div-wrapper";
import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "Primitives/GradientLegend",
  component: GradientLegendComponent,
  parameters: {
    layout: "centered",
  },
  decorators: [
    withMainController,
    withMantineProvider,
    //(story, ctx) =>
    //  withDivWrapper(story, ctx, { style: { width: 500, height: 400, display: "flex" } }),
  ],
} satisfies Meta<typeof GradientLegendComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GradientLegend: Story = {
  args: {
    startColor: "#ff0000",
    endColor: "#00ff00",
    width: 300,
    height: 200,
    descriptionFn: () => `2023-01-01`,
  },
};

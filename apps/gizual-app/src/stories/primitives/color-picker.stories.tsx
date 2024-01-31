import { ColorPicker as ColorPickerComponent } from "@app/primitives/color-picker";
import type { Meta, StoryObj } from "@storybook/react";

import withDivWrapper from "../decorators/with-div-wrapper";
import withMainController from "../decorators/with-main-controller";
import withMantineProvider from "../decorators/with-mantine-provider";

const meta = {
  title: "Primitives/ColorPicker",
  component: ColorPickerRow,
  parameters: {
    layout: "centered",
  },
  decorators: [
    withMainController,
    withMantineProvider,
    (story, ctx) =>
      withDivWrapper(story, ctx, {
        style: {
          width: "80dvw",
          height: "80dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }),
  ],
} satisfies Meta<typeof ColorPickerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ColorPicker: Story = {};

function ColorPickerRow() {
  return (
    <div
      style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", gap: "1rem" }}
    >
      <ColorPickerComponent
        hexValue={"#f123ff"}
        onAccept={(n) => console.log("CP1 `onAccept`:", n)}
        onChange={(n) => console.log("CP1 `onChange`:", n)}
      />

      <ColorPickerComponent
        hexValue={"#000fff"}
        onAccept={(n) => console.log("CP2 `onAccept`:", n)}
        onChange={(n) => console.log("CP2 `onChange`:", n)}
      />
    </div>
  );
}

import { StoryContext, StoryFn } from "@storybook/react";

const withFixedSize = (Story: StoryFn, context: StoryContext) => {
  return (
    <div style={{ width: 400, height: 400, overflow: "auto", border: "0.5px dashed pink" }}>
      <Story {...context} />
    </div>
  );
};

export default withFixedSize;

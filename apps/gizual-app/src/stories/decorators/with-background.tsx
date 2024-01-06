import { StoryContext, StoryFn } from "@storybook/react";

const withBackground = (Story: StoryFn, context: StoryContext) => {
  return (
    <div style={{ backgroundColor: "var(--background-primary)" }}>
      <Story {...context} />
    </div>
  );
};

export default withBackground;

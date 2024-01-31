import { StoryContext, StoryFn } from "@storybook/react";

type WithDivWrapperProps = React.HTMLAttributes<HTMLDivElement>;

const withDivWrapper = (Story: StoryFn, context: StoryContext, props?: WithDivWrapperProps) => {
  return (
    <div
      {...props}
      style={{
        width: 500,
        height: 500,
        overflow: "auto",
        border: "0.5px dashed pink",
        position: "relative",
        ...props?.style,
      }}
    >
      <Story {...context} />
    </div>
  );
};

export default withDivWrapper;

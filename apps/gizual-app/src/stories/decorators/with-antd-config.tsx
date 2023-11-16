import { useStyle, useTheme } from "@app/utils";
import type { StoryContext, StoryFn } from "@storybook/react";
import { App as AntdApp } from "antd";
import { ConfigProvider, theme as AntdTheme, ThemeConfig } from "antd";
import { SeedToken } from "antd/es/theme/interface";

const withAntdConfig = (Story: StoryFn, context: StoryContext) => {
  const preferredTheme = useTheme();

  const customStyle: SeedToken = {
    ...AntdTheme.defaultSeed,
    ...AntdTheme.compactAlgorithm,
    colorPrimary: useStyle("--accent-main"),
    colorBgBase: useStyle("--background-primary"),
    colorTextBase: useStyle("--foreground-primary"),
    borderRadius: 4,
    fontFamily: "FiraGO",
  };

  const token =
    preferredTheme === "dark"
      ? AntdTheme.darkAlgorithm(customStyle)
      : AntdTheme.defaultAlgorithm(customStyle);

  const config: ThemeConfig = {
    components: {
      Skeleton: {
        gradientFromColor: "var(--background-secondary)",
        gradientToColor: "var(--background-tertiary)",
      },
      Select: {
        colorBorder: "var(--border-primary)",
        colorBgContainer: "var(--background-tertiary)",
      },
      Input: {
        colorBorder: "var(--border-primary)",
        colorBgContainer: "var(--background-tertiary)",
      },
      InputNumber: {
        colorBorder: "var(--border-primary)",
        colorBgContainer: "var(--background-tertiary)",
      },
      Table: {
        colorBgContainer: "var(--background-primary)",
      },
    },
    token,
  };

  return (
    <ConfigProvider theme={config}>
      <AntdApp>
        <Story {...context} />
      </AntdApp>
    </ConfigProvider>
  );
};

export default withAntdConfig;

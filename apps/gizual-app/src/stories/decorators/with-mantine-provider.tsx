import { useTheme } from "@app/hooks/use-theme";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { StoryContext, StoryFn } from "@storybook/react";
import { ContextMenuProvider } from "mantine-contextmenu";

import "@mantine/core/styles.layer.css";
import "mantine-contextmenu/styles.layer.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

const withMantineProvider = (Story: StoryFn, context: StoryContext) => {
  const mantineTheme = createTheme({
    colors: {
      accentMain: [
        "#e6f8ff",
        "#d0ecff",
        "#a0d7fc",
        "#6cc1fb",
        "#46adfa",
        "#32a2fa",
        "#259cfb",
        "#1788e0",
        "#0078c9",
        "#0068b2",
      ],
    },
    primaryColor: "accentMain",
    fontFamily: "FiraGO",
    fontFamilyMonospace: "Iosevka Extended",
  });

  const theme = useTheme();

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={theme}>
      <Notifications position="top-right" />
      <ContextMenuProvider>
        <Story {...context} />
      </ContextMenuProvider>
    </MantineProvider>
  );
};

export default withMantineProvider;

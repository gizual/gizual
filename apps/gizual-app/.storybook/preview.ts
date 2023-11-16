import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";

import "../src/index.scss";
import "../src/icons/fonts.css";
import "../src/icons/icons.css";
import "../src/icons/colors.css";

const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      // Set the initial theme based on system preference
      current: prefersDark ? "dark" : "light",
      // Customization for dark theme
      dark: { ...themes.dark, appBg: "black" },
      // Customization for light theme
      light: { ...themes.normal, appBg: "white" },
    },
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: "var(--color-darkgray)",
        },
        {
          name: "light",
          value: "var(--color-white)",
        },
      ],
    },
  },
};

export default preview;

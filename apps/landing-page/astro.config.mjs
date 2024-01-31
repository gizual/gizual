import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";
import astroReact from "@astrojs/react";
import svgr from "vite-plugin-svgr";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), astroReact()],
  vite: {
    plugins: [
      svgr({
        include: "**/*.svg?react",
        svgrOptions: {
          plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
          svgoConfig: {
            plugins: ["preset-default", "removeTitle", "removeDesc", "removeDoctype", "cleanupIds"],
          },
        },
      }),
    ],
  },
});

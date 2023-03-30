import { defineConfig } from "turbowatch";

export default defineConfig({
  project: __dirname,
  triggers: [
    {
      expression: ["dirname", __dirname],
      interruptible: false,
      name: "vite:dev",
      onChange: async ({ spawn }) => {
        await spawn`vite`;
      },
      persistent: true,
    },
  ],
});

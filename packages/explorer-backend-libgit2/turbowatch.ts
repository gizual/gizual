import { defineConfig } from "turbowatch";

export default defineConfig({
  project: __dirname,
  triggers: [
    {
      expression: ["match", "*.rs", "basename"],
      name: "dev:build",
      onChange: async ({ spawn }) => {
        await spawn`yarn build`;
      },
    },
  ],
});

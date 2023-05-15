import { defineConfig } from "turbowatch";

export default defineConfig({
  project: __dirname,
  triggers: [
    {
      expression: ["allof", ["not", ["dirname", "dist"]], ["match", "*.ts", "basename"]],
      name: "dev:build",
      onChange: async ({ spawn }) => {
        await spawn`yarn build`;
      },
    },
  ],
});

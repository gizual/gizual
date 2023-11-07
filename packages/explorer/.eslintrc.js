module.exports = {
  root: true,
  extends: ["@giz/eslint-config"],
  env: {
    node: true,
  },
  rules: {
    "unicorn/no-useless-undefined": "off",
    "unicorn/no-null": "off",
  },
};

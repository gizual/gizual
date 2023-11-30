/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        "background-primary": "var(--background-primary)",
        "background-secondary": "var(--background-secondary)",
        "background-tertiary": "var(--background-tertiary)",
        "background-red": "var(--background-red)",

        "foreground-primary": "var(--foreground-primary)",
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-tertiary": "var(--foreground-tertiary)",
        "foreground-disabled": "var(--foreground-disabled)",
        "foreground-link": "var(--foreground-link)",

        "accent-main": "var(--accent-main)",
        "accent-main-dark": "var(--accent-main-dark)",
        "accent-main-fg": "var(--accent-main-fg)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-secondary-fg": "var(--accent-secondary-fg)",
        "accent-tertiary": "var(--accent-tertiary)",
        "accent-tertiary-fg": "var(--accent-tertiary-fg)",

        "border-primary": "var(--border-primary)",
        "border-secondary": "var(--border-secondary)",
      },
      fontFamily: {
        branding: ["FiraGO", "sans-serif"],
      },
    },
  },
  plugins: [],
};

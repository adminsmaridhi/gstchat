import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        emerald: {
          50: "#ebf5f2",
          100: "#d7ebe5",
          200: "#b0d6cb",
          300: "#7fbcaa",
          400: "#0d9a6e",
          500: "#10a878",
          600: "#087f5b",
          700: "#077050",
          800: "#065f44",
          900: "#054a35",
        },
      },
    },
  },
  plugins: [],
};
export default config;

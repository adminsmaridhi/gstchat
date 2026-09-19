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
        emerald: {
          50: "#e9f4f0",
          100: "#cfe6dd",
          200: "#a3cfc0",
          300: "#6fb2a0",
          400: "#3e9a85",
          500: "#0e6b50",
          600: "#085C44",
          700: "#074d3a",
          800: "#063e2f",
          900: "#042e23",
        },
      },
    },
  },
  plugins: [],
};
export default config;

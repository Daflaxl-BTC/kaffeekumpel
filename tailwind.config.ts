import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kaffee: {
          50: "#FAF6F1",
          100: "#F1E7D8",
          200: "#E8D5B8",
          300: "#D2B48C",
          400: "#C4A076",
          500: "#8B5A2B",
          600: "#7A4E32",
          700: "#5B3A1E",
          800: "#3A2618",
          900: "#2E1D10",
        },
        leaf: {
          light: "#5A8A54",
          DEFAULT: "#3D6B3A",
          dark: "#2D4A2B",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

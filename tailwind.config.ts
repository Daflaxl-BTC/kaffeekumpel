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
          300: "#D2B48C",
          500: "#8B5A2B",
          700: "#5B3A1E",
          900: "#2E1D10",
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

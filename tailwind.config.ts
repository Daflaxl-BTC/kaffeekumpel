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
      keyframes: {
        "tap-pulse": {
          "0%": { opacity: "0.6", transform: "scale(0.9)" },
          "60%": { opacity: "0.25", transform: "scale(1.05)" },
          "100%": { opacity: "0", transform: "scale(1.15)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "tap-pulse": "tap-pulse 700ms ease-out forwards",
        "fade-in-up": "fade-in-up 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

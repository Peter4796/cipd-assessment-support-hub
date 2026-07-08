import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy — primary brand
        navy: {
          50: "#eef1f6",
          100: "#d3dae7",
          200: "#a8b6cf",
          300: "#7c91b6",
          400: "#516d9e",
          500: "#33507f",
          600: "#233a5e",
          700: "#1a2c48",
          800: "#122036",
          900: "#0c1626",
          950: "#070d18",
        },
        // Muted gold accent
        gold: {
          50: "#fbf7ee",
          100: "#f3e8cc",
          200: "#e7d199",
          300: "#dbb866",
          400: "#cfa23f",
          500: "#c39a3a",
          600: "#a67d2c",
          700: "#845f24",
          800: "#634624",
          900: "#523a21",
        },
        // Teal alternate accent
        teal: {
          50: "#edf9f8",
          100: "#d0efec",
          200: "#a3ddd8",
          300: "#6cc4bd",
          400: "#3ca69f",
          500: "#2b8b85",
          600: "#227069",
          700: "#1f5a55",
          800: "#1d4844",
          900: "#1b3c39",
        },
        // Light grey backgrounds
        mist: {
          50: "#fafbfc",
          100: "#f4f6f8",
          200: "#e9edf1",
          300: "#dbe1e8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(12, 22, 38, 0.06), 0 8px 24px rgba(12, 22, 38, 0.06)",
        "card-hover": "0 4px 12px rgba(12, 22, 38, 0.10), 0 16px 40px rgba(12, 22, 38, 0.10)",
        soft: "0 1px 2px rgba(12, 22, 38, 0.04)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      maxWidth: {
        content: "1180px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;

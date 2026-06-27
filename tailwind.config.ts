import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        muted: "#667085",
        line: "#d9e1e7",
        wash: "#f5f7f9",
        teal: "#0f9f8f",
        amber: "#d99122",
        danger: "#c94040"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 24, 40, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

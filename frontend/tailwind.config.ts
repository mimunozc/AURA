import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          primary: "#8EA7FF",
          primaryHover: "#7B95F2",
          text: "#0F172A",
          subtext: "#475569",
          border: "#E2E8F0",
          accent: "#A7F3D0",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 6px 24px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [forms],
};
export default config;

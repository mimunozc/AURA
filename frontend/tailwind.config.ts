import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: { base: "#0f766e" },
      },
      borderRadius: {
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [forms],
};

export default config;

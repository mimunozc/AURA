/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#4A3AFF",
        "brand-primary-dark": "#3528B8",

        "brand-bg": "#F7F7F9",
        "brand-bg-soft": "#FFFFFF",
        "brand-card": "#FFFFFF",

        "brand-text": "#1C1C1E",
        "brand-subtext": "#6E6E73",

        "brand-border": "#E1E1E5",
        
        "brand-button-bg": "#4A3AFF",
        "brand-button-text": "#FFFFFF",
        "brand-button-bg-hover": "#3528B8",
      },
      borderRadius: {
        xl: "1rem",
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bleu CMI (Centre Még@tique International)
        primary: {
          50: "#eef7fc",
          100: "#d6ebf7",
          200: "#aed7ef",
          300: "#7cbde4",
          400: "#4aa3d9",
          500: "#2b8fce",
          600: "#2174ab",
          700: "#1b5d88",
          800: "#164a6c",
          900: "#123a55",
        },
      },
    },
  },
  plugins: [],
}
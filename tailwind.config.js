/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1B2A4A",
          blue: "#2E75B6",
          "light-blue": "#E8F0FE",
          green: "#2D8A4E",
          "light-green": "#E6F4EA",
          gold: "#D4A843",
          "light-gold": "#FEF7E0",
        },
      },
    },
  },
  plugins: [],
};

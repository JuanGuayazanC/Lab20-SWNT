/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { 950: "#102820", 900: "#17382e", 800: "#244b3d" },
        leaf: { 500: "#65a879", 400: "#8dc39b" },
        sand: "#f5f6f1"
      },
      boxShadow: { soft: "0 16px 44px rgba(16, 40, 32, .08)" }
    }
  },
  plugins: []
};

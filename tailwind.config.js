/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#5DD9C1",
        coral: "#FF8A7A",
        cream: "#FAF7F2",
        ink: "#2B2B2B",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 4px 16px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

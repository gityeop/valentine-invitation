/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: "#ff5ba8",
        candy: "#ff8fc5",
        peach: "#ffb88f"
      },
      boxShadow: {
        glam: "0 24px 55px rgba(255, 67, 154, 0.22)"
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        creator: {
          50: '#f0fdf4',
          500: '#22c55e', // A cool green brand color
          900: '#14532d',
        }
      }
    },
  },
  plugins: [],
}